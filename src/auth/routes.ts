import { Router, Request, Response } from 'express';
import { OAuthService } from './oauth.service';
import { TokenService, TokenPayload } from './token.service';
import { PKCEService } from './pkce.service';
import { authenticate } from './middleware/authenticate';
import { AppDataSource } from '../database';
import { User } from '../entities/User';

const router = Router();

/**
 * GET /auth/github
 * Initiates GitHub OAuth flow
 * Query params: redirect_uri (optional), code_challenge (for PKCE)
 */
router.get('/github', (req: Request, res: Response) => {
  try {
    const redirectUri = req.query.redirect_uri as string || `${process.env.BACKEND_URL || 'http://localhost:5000'}/auth/github/callback`;
    const codeChallenge = req.query.code_challenge as string;
    const state = req.query.state as string;

    if (!codeChallenge || !state) {
      res.status(400).json({
        status: 'error',
        message: 'Missing required parameters: code_challenge, state',
      });
      return;
    }

    const authUrl = OAuthService.generateAuthorizationUrl(redirectUri, state, codeChallenge);

    res.json({
      status: 'success',
      authUrl,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate authorization URL',
    });
  }
});

/**
 * GET /auth/github/callback
 * Handles GitHub OAuth callback
 * Query params: code, state
 */
router.get('/github/callback', async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string;
    const state = req.query.state as string;

    if (!code || !state) {
      res.status(400).json({
        status: 'error',
        message: 'Missing required parameters: code, state',
      });
      return;
    }

    // Complete OAuth flow
    const { user, tokens } = await OAuthService.completeOAuthFlow(code);

    // For web portal: set HTTP-only cookie
    const isWebPortal = req.query.client_type === 'web';
    if (isWebPortal) {
      res.cookie('accessToken', tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: tokens.accessTokenExpiresIn * 1000,
      });

      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: tokens.refreshTokenExpiresIn * 1000,
      });

      // Redirect to web portal dashboard
      const webPortalUrl = process.env.WEB_PORTAL_URL || 'http://localhost:3000';
      res.redirect(`${webPortalUrl}/dashboard`);
      return;
    }

    // For CLI: return tokens in response
    res.json({
      status: 'success',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        accessTokenExpiresIn: tokens.accessTokenExpiresIn,
        refreshTokenExpiresIn: tokens.refreshTokenExpiresIn,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'OAuth callback failed',
    });
  }
});

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 * Body: { refresh_token: string }
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      res.status(400).json({
        status: 'error',
        message: 'Missing refresh_token',
      });
      return;
    }

    // Verify refresh token
    const decoded = TokenService.verifyToken(refresh_token);
    if (!decoded) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid refresh token',
      });
      return;
    }

    // Check if refresh token is valid in metadata
    const isValid = await TokenService.verifyRefreshTokenMetadata(refresh_token);
    if (!isValid) {
      res.status(401).json({
        status: 'error',
        message: 'Refresh token expired or revoked',
      });
      return;
    }

    // Revoke old refresh token
    await TokenService.revokeRefreshToken(refresh_token);

    // Generate new token pair
    const newTokens = TokenService.generateTokenPair(decoded.userId, decoded.username, decoded.role);

    // Store new refresh token metadata
    const expiresAt = new Date(Date.now() + newTokens.refreshTokenExpiresIn * 1000);
    await TokenService.storeRefreshTokenMetadata(decoded.userId, newTokens.refreshToken, expiresAt);

    res.json({
      status: 'success',
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
      accessTokenExpiresIn: newTokens.accessTokenExpiresIn,
      refreshTokenExpiresIn: newTokens.refreshTokenExpiresIn,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Token refresh failed',
    });
  }
});

/**
 * POST /auth/logout
 * Logout user and invalidate all refresh tokens
 */
router.post('/logout', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
      return;
    }

    // Revoke all refresh tokens for user
    await TokenService.revokeAllUserTokens(req.userId);

    // Clear cookies if set
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.json({
      status: 'success',
      message: 'Logged out successfully',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Logout failed',
    });
  }
});

/**
 * GET /auth/me
 * Get current user information
 */
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
      return;
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: req.userId },
    });

    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
      return;
    }

    res.json({
      status: 'success',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.role,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch user information',
    });
  }
});

export default router;
