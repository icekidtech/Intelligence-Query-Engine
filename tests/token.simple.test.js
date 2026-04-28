// Simple Token Service Tests (No dependencies)
// This test file can run with plain Node.js

const crypto = require('crypto');

// JWT Implementation (simplified for testing)
class SimpleJWT {
  static sign(payload, secret) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${header}.${body}`)
      .digest('base64url');
    return `${header}.${body}.${signature}`;
  }

  static verify(token, secret) {
    try {
      const [header, body, signature] = token.split('.');
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${header}.${body}`)
        .digest('base64url');
      
      if (signature !== expectedSignature) {
        return null;
      }

      const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
      return payload;
    } catch (error) {
      return null;
    }
  }
}

// Token Service Implementation (simplified for testing)
class TokenService {
  static JWT_SECRET = 'test-secret-key-for-testing';
  static ACCESS_TOKEN_EXPIRY = 180; // 3 minutes
  static REFRESH_TOKEN_EXPIRY = 300; // 5 minutes

  static generateTokenPair(userId, username, role) {
    const now = Math.floor(Date.now() / 1000);

    const accessTokenPayload = {
      userId,
      username,
      role,
      iat: now,
      exp: now + this.ACCESS_TOKEN_EXPIRY,
    };

    const accessToken = SimpleJWT.sign(accessTokenPayload, this.JWT_SECRET);

    const refreshTokenPayload = {
      userId,
      username,
      role,
      iat: now,
      exp: now + this.REFRESH_TOKEN_EXPIRY,
    };

    const refreshToken = SimpleJWT.sign(refreshTokenPayload, this.JWT_SECRET);

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresIn: this.ACCESS_TOKEN_EXPIRY,
      refreshTokenExpiresIn: this.REFRESH_TOKEN_EXPIRY,
    };
  }

  static verifyToken(token) {
    return SimpleJWT.verify(token, this.JWT_SECRET);
  }

  static isTokenExpired(token) {
    const decoded = this.verifyToken(token);
    if (!decoded) return true;

    const now = Math.floor(Date.now() / 1000);
    return decoded.exp <= now;
  }

  static hashRefreshToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

// Test Suite
console.log('=== Token Service Tests ===\n');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✓ ${message}`);
    passedTests++;
  } else {
    console.log(`✗ ${message}`);
    failedTests++;
  }
}

// Test 1: Token Pair Generation
console.log('Test 1: Token Pair Generation');
const tokens = TokenService.generateTokenPair('user-123', 'testuser', 'analyst');
console.log(`Access token: ${tokens.accessToken.substring(0, 20)}...`);
console.log(`Refresh token: ${tokens.refreshToken.substring(0, 20)}...`);
assert(tokens.accessToken.length > 0, 'Access token should not be empty');
assert(tokens.refreshToken.length > 0, 'Refresh token should not be empty');
assert(tokens.accessTokenExpiresIn === 180, 'Access token should expire in 3 minutes (180 seconds)');
assert(tokens.refreshTokenExpiresIn === 300, 'Refresh token should expire in 5 minutes (300 seconds)');
console.log('');

// Test 2: Token Verification
console.log('Test 2: Token Verification');
const decoded = TokenService.verifyToken(tokens.accessToken);
assert(decoded !== null, 'Valid token should be verified');
assert(decoded?.userId === 'user-123', 'Token should contain correct userId');
assert(decoded?.username === 'testuser', 'Token should contain correct username');
assert(decoded?.role === 'analyst', 'Token should contain correct role');
console.log('');

// Test 3: Invalid Token Verification
console.log('Test 3: Invalid Token Verification');
const invalidToken = 'invalid.token.here';
const invalidDecoded = TokenService.verifyToken(invalidToken);
assert(invalidDecoded === null, 'Invalid token should fail verification');
console.log('');

// Test 4: Token Expiry Checking
console.log('Test 4: Token Expiry Checking');
const isExpired = TokenService.isTokenExpired(tokens.accessToken);
assert(isExpired === false, 'Fresh token should not be expired');
console.log('');

// Test 5: Refresh Token Hash
console.log('Test 5: Refresh Token Hash');
const hash1 = TokenService.hashRefreshToken(tokens.refreshToken);
const hash2 = TokenService.hashRefreshToken(tokens.refreshToken);
assert(hash1 === hash2, 'Same token should produce same hash');
assert(hash1.length === 64, 'SHA-256 hash should be 64 characters');
console.log('');

// Test 6: Admin Token Generation
console.log('Test 6: Admin Token Generation');
const adminTokens = TokenService.generateTokenPair('admin-123', 'adminuser', 'admin');
const adminDecoded = TokenService.verifyToken(adminTokens.accessToken);
assert(adminDecoded?.role === 'admin', 'Admin token should have admin role');
console.log('');

// Test 7: Multiple Token Pairs
console.log('Test 7: Multiple Token Pairs');
const tokens1 = TokenService.generateTokenPair('user-1', 'user1', 'analyst');
const tokens2 = TokenService.generateTokenPair('user-2', 'user2', 'analyst');
assert(tokens1.accessToken !== tokens2.accessToken, 'Different users should have different tokens');
assert(tokens1.refreshToken !== tokens2.refreshToken, 'Different users should have different refresh tokens');
console.log('');

// Test 8: Token Payload Structure
console.log('Test 8: Token Payload Structure');
const payload = TokenService.verifyToken(tokens.accessToken);
assert(payload?.iat !== undefined, 'Token should have iat (issued at)');
assert(payload?.exp !== undefined, 'Token should have exp (expiration)');
assert(payload?.exp > payload?.iat, 'Expiration should be after issued at');
console.log('');

// Test 9: Token Contains All Required Fields
console.log('Test 9: Token Contains All Required Fields');
const fullPayload = TokenService.verifyToken(tokens.accessToken);
assert(fullPayload?.userId !== undefined, 'Token should contain userId');
assert(fullPayload?.username !== undefined, 'Token should contain username');
assert(fullPayload?.role !== undefined, 'Token should contain role');
assert(fullPayload?.iat !== undefined, 'Token should contain iat');
assert(fullPayload?.exp !== undefined, 'Token should contain exp');
console.log('');

// Summary
console.log('=== Test Summary ===');
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);
console.log(`Total: ${passedTests + failedTests}`);

if (failedTests === 0) {
  console.log('\n✓ All Token Tests Passed!');
  process.exit(0);
} else {
  console.log('\n✗ Some tests failed');
  process.exit(1);
}
