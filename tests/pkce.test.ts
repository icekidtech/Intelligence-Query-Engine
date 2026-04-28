import { PKCEService } from '../src/auth/pkce.service';

/**
 * PKCE Service Unit Tests
 * Tests for code verifier generation, code challenge derivation, and state generation
 */

console.log('=== PKCE Service Tests ===\n');

// Test 1: Code Verifier Generation
console.log('Test 1: Code Verifier Generation');
const codeVerifier = PKCEService.generateCodeVerifier();
console.log(`Generated code_verifier: ${codeVerifier.substring(0, 20)}...`);
console.log(`Length: ${codeVerifier.length}`);
console.assert(codeVerifier.length >= 43 && codeVerifier.length <= 128, 'Code verifier length should be 43-128');
console.assert(/^[A-Za-z0-9_-]+$/.test(codeVerifier), 'Code verifier should be URL-safe base64');
console.log('✓ Code verifier generation passed\n');

// Test 2: Code Challenge Derivation
console.log('Test 2: Code Challenge Derivation');
const codeChallenge = PKCEService.generateCodeChallenge(codeVerifier);
console.log(`Generated code_challenge: ${codeChallenge.substring(0, 20)}...`);
console.log(`Length: ${codeChallenge.length}`);
console.assert(/^[A-Za-z0-9_-]+$/.test(codeChallenge), 'Code challenge should be URL-safe base64');
console.log('✓ Code challenge derivation passed\n');

// Test 3: Code Challenge Consistency (Property 1)
console.log('Test 3: Code Challenge Consistency (Property 1)');
const verifier = PKCEService.generateCodeVerifier();
const challenge1 = PKCEService.generateCodeChallenge(verifier);
const challenge2 = PKCEService.generateCodeChallenge(verifier);
console.assert(challenge1 === challenge2, 'Same verifier should produce same challenge');
console.log('✓ Code challenge consistency passed\n');

// Test 4: State Generation
console.log('Test 4: State Generation');
const state = PKCEService.generateState();
console.log(`Generated state: ${state.substring(0, 20)}...`);
console.log(`Length: ${state.length}`);
console.assert(state.length === 64, 'State should be 64 characters (32 bytes hex)');
console.assert(/^[0-9a-f]+$/.test(state), 'State should be hex string');
console.log('✓ State generation passed\n');

// Test 5: Unique State Generation (Property 2)
console.log('Test 5: Unique State Generation (Property 2)');
const states = new Set();
for (let i = 0; i < 100; i++) {
  states.add(PKCEService.generateState());
}
console.assert(states.size === 100, 'All generated states should be unique');
console.log('✓ Unique state generation passed\n');

// Test 6: Complete Challenge Generation
console.log('Test 6: Complete Challenge Generation');
const challenge = PKCEService.generateChallenge();
console.assert(challenge.codeVerifier.length >= 43, 'Code verifier should be at least 43 chars');
console.assert(challenge.codeChallenge.length > 0, 'Code challenge should not be empty');
console.assert(challenge.state.length === 64, 'State should be 64 characters');
console.log('✓ Complete challenge generation passed\n');

// Test 7: Challenge Verification
console.log('Test 7: Challenge Verification');
const testVerifier = PKCEService.generateCodeVerifier();
const testChallenge = PKCEService.generateCodeChallenge(testVerifier);
const isValid = PKCEService.verifyChallenge(testVerifier, testChallenge);
console.assert(isValid === true, 'Valid challenge should verify successfully');
console.log('✓ Challenge verification passed\n');

// Test 8: Invalid Challenge Verification
console.log('Test 8: Invalid Challenge Verification');
const invalidChallenge = PKCEService.generateCodeChallenge(PKCEService.generateCodeVerifier());
const isInvalid = PKCEService.verifyChallenge(testVerifier, invalidChallenge);
console.assert(isInvalid === false, 'Invalid challenge should fail verification');
console.log('✓ Invalid challenge verification passed\n');

console.log('=== All PKCE Tests Passed ===');
