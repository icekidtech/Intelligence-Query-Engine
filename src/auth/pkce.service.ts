import crypto from 'crypto';

export interface PKCEChallenge {
  codeVerifier: string;
  codeChallenge: string;
  state: string;
}

/**
 * PKCE (Proof Key for Code Exchange) Service
 * Implements secure OAuth 2.0 flow for CLI applications
 */
export class PKCEService {
  /**
   * Generate a random code verifier (43-128 characters)
   * Uses URL-safe base64 encoding
   */
  static generateCodeVerifier(): string {
    const length = 128; // Maximum length for better security
    const randomBytes = crypto.randomBytes(Math.ceil((length * 3) / 4));
    return randomBytes
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
      .slice(0, length);
  }

  /**
   * Generate code challenge from code verifier using SHA-256
   * Formula: code_challenge = BASE64URL(SHA256(code_verifier))
   */
  static generateCodeChallenge(codeVerifier: string): string {
    const hash = crypto.createHash('sha256').update(codeVerifier).digest();
    return hash
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Generate a unique state parameter for CSRF protection
   */
  static generateState(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate complete PKCE challenge set
   */
  static generateChallenge(): PKCEChallenge {
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = this.generateCodeChallenge(codeVerifier);
    const state = this.generateState();

    return {
      codeVerifier,
      codeChallenge,
      state,
    };
  }

  /**
   * Verify that code_challenge matches code_verifier
   * Used for validation during token exchange
   */
  static verifyChallenge(codeVerifier: string, codeChallenge: string): boolean {
    const derivedChallenge = this.generateCodeChallenge(codeVerifier);
    return derivedChallenge === codeChallenge;
  }
}
