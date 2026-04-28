import axios from 'axios';
import { AppDataSource } from '../database';
import { User } from '../entities/User';
import { TokenService } from './token.service';

export interface GitHubUser {
  id: number;
  login: string;
  email: string | null;
  avatar_url: string;
  name: string | null;
}

export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

/**
 * OAuth Service
 * Handles GitHub OAuth flow and user management
 */
export class OAuthService {
  private static readonly GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
  private static readonly GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';
  private static readonly GITHUB_OAUTH_URL = 'https://github.com/login/oauth/authorize';
  private static readonly GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
  private static readonly GITHUB_USER_URL = 'https://api.github.com/user';

  /**
   * Generate GitHub OAuth authorization URL
   */
  static generateAuthorizationUrl(
    redirectUri: string,
    state: string,
    codeChallenge: string
  ): string {
    const params = new URLSearchParams({
      client_id: this.GITHUB_CLIENT_ID,
      redirect_uri: redirectUri,
      scope: 'user:email',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    return `${this.GITHUB_OAUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  static async exchangeCodeForToken(code: string): Promise<OAuthTokenResponse> {
    try {
      const response = await axios.post(
        this.GITHUB_TOKEN_URL,
        {
          client_id: this.GITHUB_CLIENT_ID,
          client_secret: this.GITHUB_CLIENT_SECRET,
          code,
        },
        {
          headers: {
            Accept: 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to exchange code for token: ${error}`);
    }
  }

  /**
   * Fetch user information from GitHub
   */
  static async fetchGitHubUser(accessToken: string): Promise<GitHubUser> {
    try {
      const response = await axios.get(this.GITHUB_USER_URL, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch GitHub user: ${error}`);
    }
  }

  /**
   * Create or update user from GitHub OAuth
   */
  static async createOrUpdateUser(githubUser: GitHubUser): Promise<User> {
    const userRepository = AppDataSource.getRepository(User);

    // Try to find existing user
    let user = await userRepository.findOne({
      where: { githubId: githubUser.id.toString() },
    });

    if (user) {
      // Update existing user
      user.lastLoginAt = new Date();
      user.email = githubUser.email || user.email;
      user.avatarUrl = githubUser.avatar_url;
      return await userRepository.save(user);
    }

    // Create new user with default role 'analyst'
    user = userRepository.create({
      githubId: githubUser.id.toString(),
      username: githubUser.login,
      email: githubUser.email,
      avatarUrl: githubUser.avatar_url,
      role: 'analyst', // Default role
      isActive: true,
      lastLoginAt: new Date(),
    });

    return await userRepository.save(user);
  }

  /**
   * Complete OAuth flow: code -> token -> user
   */
  static async completeOAuthFlow(code: string): Promise<{ user: User; tokens: any }> {
    // Exchange code for access token
    const tokenResponse = await this.exchangeCodeForToken(code);

    // Fetch user information
    const githubUser = await this.fetchGitHubUser(tokenResponse.access_token);

    // Create or update user
    const user = await this.createOrUpdateUser(githubUser);

    // Generate application tokens
    const tokens = TokenService.generateTokenPair(user.id, user.username, user.role);

    // Store refresh token metadata
    const expiresAt = new Date(Date.now() + tokens.refreshTokenExpiresIn * 1000);
    await TokenService.storeRefreshTokenMetadata(user.id, tokens.refreshToken, expiresAt);

    return { user, tokens };
  }
}
