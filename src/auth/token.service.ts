import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AppDataSource } from '../database';
import { TokenMetadata } from '../entities/TokenMetadata';

export interface TokenPayload {
  userId: string;
  username: string;
  role: 'admin' | 'analyst';
  iat: number;
  exp: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
}

/**
 * Token Service
 * Handles JWT token generation, validation, and refresh token rotation
 */
export class TokenService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  private static readonly ACCESS_TOKEN_EXPIRY = 3 * 60; // 3 minutes in seconds
  private static readonly REFRESH_TOKEN_EXPIRY = 5 * 60; // 5 minutes in seconds

  /**
   * Generate a token pair (access + refresh tokens)
   */
  static generateTokenPair(userId: string, username: string, role: 'admin' | 'analyst'): TokenPair {
    const now = Math.floor(Date.now() / 1000);

    // Generate access token
    const accessTokenPayload: TokenPayload = {
      userId,
      username,
      role,
      iat: now,
      exp: now + this.ACCESS_TOKEN_EXPIRY,
    };

    const accessToken = jwt.sign(accessTokenPayload, this.JWT_SECRET, {
      algorithm: 'HS256',
    });

    // Generate refresh token
    const refreshTokenPayload: TokenPayload = {
      userId,
      username,
      role,
      iat: now,
      exp: now + this.REFRESH_TOKEN_EXPIRY,
    };

    const refreshToken = jwt.sign(refreshTokenPayload, this.JWT_SECRET, {
      algorithm: 'HS256',
    });

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresIn: this.ACCESS_TOKEN_EXPIRY,
      refreshTokenExpiresIn: this.REFRESH_TOKEN_EXPIRY,
    };
  }

  /**
   * Verify and decode a token
   */
  static verifyToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET, {
        algorithms: ['HS256'],
      }) as TokenPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(token: string): boolean {
    const decoded = this.verifyToken(token);
    if (!decoded) return true;

    const now = Math.floor(Date.now() / 1000);
    return decoded.exp <= now;
  }

  /**
   * Hash a refresh token for storage
   */
  static hashRefreshToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Store refresh token metadata for rotation tracking
   */
  static async storeRefreshTokenMetadata(
    userId: string,
    refreshToken: string,
    expiresAt: Date
  ): Promise<TokenMetadata> {
    const tokenMetadataRepository = AppDataSource.getRepository(TokenMetadata);
    const tokenHash = this.hashRefreshToken(refreshToken);

    const metadata = tokenMetadataRepository.create({
      userId,
      refreshTokenHash: tokenHash,
      isRevoked: false,
      expiresAt,
    });

    return await tokenMetadataRepository.save(metadata);
  }

  /**
   * Verify refresh token is valid and not revoked
   */
  static async verifyRefreshTokenMetadata(refreshToken: string): Promise<boolean> {
    const tokenMetadataRepository = AppDataSource.getRepository(TokenMetadata);
    const tokenHash = this.hashRefreshToken(refreshToken);

    const metadata = await tokenMetadataRepository.findOne({
      where: {
        refreshTokenHash: tokenHash,
        isRevoked: false,
      },
    });

    if (!metadata) return false;

    // Check if token has expired
    const now = new Date();
    if (metadata.expiresAt <= now) {
      return false;
    }

    return true;
  }

  /**
   * Revoke a refresh token
   */
  static async revokeRefreshToken(refreshToken: string): Promise<void> {
    const tokenMetadataRepository = AppDataSource.getRepository(TokenMetadata);
    const tokenHash = this.hashRefreshToken(refreshToken);

    await tokenMetadataRepository.update(
      { refreshTokenHash: tokenHash },
      { isRevoked: true }
    );
  }

  /**
   * Revoke all refresh tokens for a user
   */
  static async revokeAllUserTokens(userId: string): Promise<void> {
    const tokenMetadataRepository = AppDataSource.getRepository(TokenMetadata);

    await tokenMetadataRepository.update(
      { userId },
      { isRevoked: true }
    );
  }

  /**
   * Clean up expired token metadata
   */
  static async cleanupExpiredTokens(): Promise<void> {
    const tokenMetadataRepository = AppDataSource.getRepository(TokenMetadata);

    await tokenMetadataRepository.delete({
      expiresAt: new Date(),
    });
  }
}
