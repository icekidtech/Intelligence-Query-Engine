/**
 * Calculate confidence score based on probability and sample size
 * Both conditions must be true: probability >= 0.7 AND sample_size >= 100
 */
export function calculateConfidence(probability: number, sampleSize: number): boolean {
  return probability >= 0.7 && sampleSize >= 100;
}
 
/**
 * Generate current timestamp in UTC ISO 8601 format
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}
 
/**
 * Validate query parameter type
 */
export function isValidString(value: unknown): boolean {
  return typeof value === 'string';
}
