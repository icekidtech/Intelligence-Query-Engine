import axios, { AxiosError } from 'axios';
import { GenderizeResponse, ProcessedData } from '../types/index.types';
import { calculateConfidence, getCurrentTimestamp } from '../utils/helpers.utils';

/**
 * Call the Genderize API and process the response
 * @param name - The name to classify
 * @returns ProcessedData on success, or throws an error
 */
export async function classifyGender(name: string): Promise<ProcessedData> {
  try {
    const genderizeResponse = await axios.get<GenderizeResponse>(
      'https://api.genderize.io',
      {
        params: { name },
        timeout: 5000, // 5 second timeout
      }
    );

    const { gender, probability, count } = genderizeResponse.data;

    // ===== Edge Case Handling =====
    // If gender is null or count is 0, no prediction available
    if (gender === null || count === 0) {
      throw new Error('No prediction available for the provided name');
    }

    // ===== Response Processing =====
    const is_confident = calculateConfidence(probability, count);
    const processed_at = getCurrentTimestamp();

    const processedData: ProcessedData = {
      name,
      gender,
      probability,
      sample_size: count,
      is_confident,
      processed_at,
    };

    return processedData;
  } catch (apiError) {
    // If it's our validation error (no prediction), re-throw it
    if (apiError instanceof Error && apiError.message.includes('No prediction')) {
      throw apiError;
    }
    // Only convert actual API/network errors
    const error = apiError as AxiosError;
    console.error('Genderize API error:', error.message);
    throw new Error('External API error: Unable to process gender classification');
  }
}
