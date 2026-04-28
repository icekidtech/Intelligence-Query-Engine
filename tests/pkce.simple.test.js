// Simple PKCE Service Tests (No dependencies)
// This test file can run with plain Node.js

const crypto = require('crypto');

// PKCE Service Implementation (copied for testing)
class PKCEService {
  static generateCodeVerifier() {
    const length = 128;
    const randomBytes = crypto.randomBytes(Math.ceil((length * 3) / 4));
    return randomBytes
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
      .slice(0, length);
  }

  static generateCodeChallenge(codeVerifier) {
    const hash = crypto.createHash('sha256').update(codeVerifier).digest();
    return hash
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  static generateState() {
    return crypto.randomBytes(32).toString('hex');
  }

  static generateChallenge() {
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = this.generateCodeChallenge(codeVerifier);
    const state = this.generateState();

    return {
      codeVerifier,
      codeChallenge,
      state,
    };
  }

  static verifyChallenge(codeVerifier, codeChallenge) {
    const derivedChallenge = this.generateCodeChallenge(codeVerifier);
    return derivedChallenge === codeChallenge;
  }
}

// Test Suite
console.log('=== PKCE Service Tests ===\n');

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

// Test 1: Code Verifier Generation
console.log('Test 1: Code Verifier Generation');
const codeVerifier = PKCEService.generateCodeVerifier();
console.log(`Generated code_verifier: ${codeVerifier.substring(0, 20)}...`);
console.log(`Length: ${codeVerifier.length}`);
assert(codeVerifier.length >= 43 && codeVerifier.length <= 128, 'Code verifier length should be 43-128');
assert(/^[A-Za-z0-9_-]+$/.test(codeVerifier), 'Code verifier should be URL-safe base64');
console.log('');

// Test 2: Code Challenge Derivation
console.log('Test 2: Code Challenge Derivation');
const codeChallenge = PKCEService.generateCodeChallenge(codeVerifier);
console.log(`Generated code_challenge: ${codeChallenge.substring(0, 20)}...`);
console.log(`Length: ${codeChallenge.length}`);
assert(/^[A-Za-z0-9_-]+$/.test(codeChallenge), 'Code challenge should be URL-safe base64');
console.log('');

// Test 3: Code Challenge Consistency (Property 1)
console.log('Test 3: Code Challenge Consistency (Property 1)');
const verifier = PKCEService.generateCodeVerifier();
const challenge1 = PKCEService.generateCodeChallenge(verifier);
const challenge2 = PKCEService.generateCodeChallenge(verifier);
assert(challenge1 === challenge2, 'Same verifier should produce same challenge');
console.log('');

// Test 4: State Generation
console.log('Test 4: State Generation');
const state = PKCEService.generateState();
console.log(`Generated state: ${state.substring(0, 20)}...`);
console.log(`Length: ${state.length}`);
assert(state.length === 64, 'State should be 64 characters (32 bytes hex)');
assert(/^[0-9a-f]+$/.test(state), 'State should be hex string');
console.log('');

// Test 5: Unique State Generation (Property 2)
console.log('Test 5: Unique State Generation (Property 2)');
const states = new Set();
for (let i = 0; i < 100; i++) {
  states.add(PKCEService.generateState());
}
assert(states.size === 100, 'All generated states should be unique');
console.log('');

// Test 6: Complete Challenge Generation
console.log('Test 6: Complete Challenge Generation');
const challenge = PKCEService.generateChallenge();
assert(challenge.codeVerifier.length >= 43, 'Code verifier should be at least 43 chars');
assert(challenge.codeChallenge.length > 0, 'Code challenge should not be empty');
assert(challenge.state.length === 64, 'State should be 64 characters');
console.log('');

// Test 7: Challenge Verification
console.log('Test 7: Challenge Verification');
const testVerifier = PKCEService.generateCodeVerifier();
const testChallenge = PKCEService.generateCodeChallenge(testVerifier);
const isValid = PKCEService.verifyChallenge(testVerifier, testChallenge);
assert(isValid === true, 'Valid challenge should verify successfully');
console.log('');

// Test 8: Invalid Challenge Verification
console.log('Test 8: Invalid Challenge Verification');
const invalidChallenge = PKCEService.generateCodeChallenge(PKCEService.generateCodeVerifier());
const isInvalid = PKCEService.verifyChallenge(testVerifier, invalidChallenge);
assert(isInvalid === false, 'Invalid challenge should fail verification');
console.log('');

// Summary
console.log('=== Test Summary ===');
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);
console.log(`Total: ${passedTests + failedTests}`);

if (failedTests === 0) {
  console.log('\n✓ All PKCE Tests Passed!');
  process.exit(0);
} else {
  console.log('\n✗ Some tests failed');
  process.exit(1);
}
