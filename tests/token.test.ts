import { TokenService } from '../src/auth/token.service';

/**
 * Token Service Unit Tests
 * Tests for JWT token generation, validation, and expiry checking
 */

console.log('=== Token Service Tests ===\n');

// Test 1: Token Pair Generation
console.log('Test 1: Token Pair Generation');
const tokens = TokenService.generateTokenPair('user-123', 'testuser', 'analyst');
console.log(`Access token: ${tokens.accessToken.substring(0, 20)}...`);
console.log(`Refresh token: ${tokens.refreshToken.substring(0, 20)}...`);
console.assert(tokens.accessToken.length > 0, 'Access token should not be empty');
console.assert(tokens.refreshToken.length > 0, 'Refresh token should not be empty');
console.assert(tokens.accessTokenExpiresIn === 180, 'Access token should expire in 3 minutes (180 seconds)');
console.assert(tokens.refreshTokenExpiresIn === 300, 'Refresh token should expire in 5 minutes (300 seconds)');
console.log('✓ Token pair generation passed\n');

// Test 2: Token Verification
console.log('Test 2: Token Verification');
const decoded = TokenService.verifyToken(tokens.accessToken);
console.assert(decoded !== null, 'Valid token should be verified');
console.assert(decoded?.userId === 'user-123', 'Token should contain correct userId');
console.assert(decoded?.username === 'testuser', 'Token should contain correct username');
console.assert(decoded?.role === 'analyst', 'Token should contain correct role');
console.log('✓ Token verification passed\n');

// Test 3: Invalid Token Verification
console.log('Test 3: Invalid Token Verification');
const invalidToken = 'invalid.token.here';
const invalidDecoded = TokenService.verifyToken(invalidToken);
console.assert(invalidDecoded === null, 'Invalid token should fail verification');
console.log('✓ Invalid token verification passed\n');

// Test 4: Token Expiry Checking
console.log('Test 4: Token Expiry Checking');
const isExpired = TokenService.isTokenExpired(tokens.accessToken);
console.assert(isExpired === false, 'Fresh token should not be expired');
console.log('✓ Token expiry checking passed\n');

// Test 5: Refresh Token Hash
console.log('Test 5: Refresh Token Hash');
const hash1 = TokenService.hashRefreshToken(tokens.refreshToken);
const hash2 = TokenService.hashRefreshToken(tokens.refreshToken);
console.assert(hash1 === hash2, 'Same token should produce same hash');
console.assert(hash1.length === 64, 'SHA-256 hash should be 64 characters');
console.log('✓ Refresh token hash passed\n');

// Test 6: Admin Token Generation
console.log('Test 6: Admin Token Generation');
const adminTokens = TokenService.generateTokenPair('admin-123', 'adminuser', 'admin');
const adminDecoded = TokenService.verifyToken(adminTokens.accessToken);
console.assert(adminDecoded?.role === 'admin', 'Admin token should have admin role');
console.log('✓ Admin token generation passed\n');

// Test 7: Multiple Token Pairs
console.log('Test 7: Multiple Token Pairs');
const tokens1 = TokenService.generateTokenPair('user-1', 'user1', 'analyst');
const tokens2 = TokenService.generateTokenPair('user-2', 'user2', 'analyst');
console.assert(tokens1.accessToken !== tokens2.accessToken, 'Different users should have different tokens');
console.assert(tokens1.refreshToken !== tokens2.refreshToken, 'Different users should have different refresh tokens');
console.log('✓ Multiple token pairs passed\n');

// Test 8: Token Payload Structure
console.log('Test 8: Token Payload Structure');
const payload = TokenService.verifyToken(tokens.accessToken);
console.assert(payload?.iat !== undefined, 'Token should have iat (issued at)');
console.assert(payload?.exp !== undefined, 'Token should have exp (expiration)');
console.assert(payload?.exp > payload?.iat, 'Expiration should be after issued at');
console.log('✓ Token payload structure passed\n');

console.log('=== All Token Tests Passed ===');
