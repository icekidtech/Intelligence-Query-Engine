import { v7 as uuidv7 } from 'uuid';
import axios from 'axios';
import { profileRepository } from '../repositories/ProfileRepository';
import { queryParser } from './queryparser.services';
import { ProfileFilterQuery, SortOptions, PaginationParams, PaginatedResponse } from '../types/index.types';

// Generate UUID v7 (timestamp-based)
function generateUUID(): string {
  return uuidv7();
}

export interface ProcessedProfile {
  id: string;
  name: string;
  gender: string | null;
  gender_probability: number | null;
  sample_size: number | null;
  age: number | null;
  age_group: string | null;
  country_id: string | null;
  country_probability: number | null;
  created_at: string;
}

export class ProfilesService {
  private genderizeURL = process.env.GENDERIZE_API_URL || 'https://api.genderize.io';
  private agifyURL = process.env.AGIFY_API_URL || 'https://api.agify.io';
  private nationalizeURL = process.env.NATIONALIZE_API_URL || 'https://api.nationalize.io';
  private timeout = parseInt(process.env.API_TIMEOUT || '5000', 10);

  /**
   * Classify age into age groups
   */
  private classifyAgeGroup(age: number | null): string | null {
    if (age === null) return null;
    if (age >= 0 && age <= 12) return 'child';
    if (age >= 13 && age <= 19) return 'teenager';
    if (age >= 20 && age <= 59) return 'adult';
    if (age >= 60) return 'senior';
    return null;
  }

  /**
   * Call Genderize API
   */
  private async callGenderizeAPI(name: string): Promise<any> {
    try {
      const response = await axios.get(this.genderizeURL, {
        params: { name: name.trim() },
        timeout: this.timeout,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Genderize returned an invalid response`);
    }
  }

  /**
   * Call Agify API
   */
  private async callAgifyAPI(name: string): Promise<any> {
    try {
      const response = await axios.get(this.agifyURL, {
        params: { name: name.trim() },
        timeout: this.timeout,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Agify returned an invalid response`);
    }
  }

  /**
   * Call Nationalize API
   */
  private async callNationalizeAPI(name: string): Promise<any> {
    try {
      const response = await axios.get(this.nationalizeURL, {
        params: { name: name.trim() },
        timeout: this.timeout,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Nationalize returned an invalid response`);
    }
  }

  /**
   * Enrich a name with data from all three external APIs
   */
  async enrichProfile(name: string): Promise<ProcessedProfile> {
    try {
      // Call all three APIs in parallel
      const [genderizeResp, agifyResp, nationalizeResp] = await Promise.all([
        this.callGenderizeAPI(name),
        this.callAgifyAPI(name),
        this.callNationalizeAPI(name),
      ]);

      // Validate Genderize response
      if (!genderizeResp.gender || genderizeResp.count === 0) {
        console.error('Genderize validation failed:', { gender: genderizeResp.gender, count: genderizeResp.count, full: genderizeResp });
        throw new Error('Genderize returned an invalid response');
      }

      // Validate Agify response
      if (agifyResp.age === null) {
        console.error('Agify validation failed:', { age: agifyResp.age, full: agifyResp });
        throw new Error('Agify returned an invalid response');
      }

      // Validate Nationalize response
      if (!nationalizeResp.country || nationalizeResp.country.length === 0) {
        console.error('Nationalize validation failed:', { country: nationalizeResp.country, full: nationalizeResp });
        throw new Error('Nationalize returned an invalid response');
      }

      // Extract country with highest probability
      const topCountry = nationalizeResp.country.reduce((prev: any, current: any) =>
        current.probability > prev.probability ? current : prev
      );

      // Process and structure the data
      const profile: ProcessedProfile = {
        id: generateUUID(),
        name: name.trim(),
        gender: genderizeResp.gender,
        gender_probability: genderizeResp.probability,
        sample_size: genderizeResp.count,
        age: agifyResp.age,
        age_group: this.classifyAgeGroup(agifyResp.age),
        country_id: topCountry.country_id,
        country_probability: topCountry.probability,
        created_at: new Date().toISOString(),
      };

      return profile;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Query profiles with advanced filtering, sorting, and pagination
   */
  async queryProfiles(
    filters?: ProfileFilterQuery,
    sort?: SortOptions,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<any>> {
    const { total, data } = await profileRepository.findAllAdvanced(
      filters,
      sort,
      pagination
    );

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;

    return {
      status: 'success',
      page,
      limit,
      total,
      data,
    };
  }

  /**
   * Search profiles using natural language query
   */
  async searchWithNaturalLanguage(
    q: string,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<any>> {
    const filters = queryParser.parseQuery(q);

    if (filters === null) {
      return {
        status: 'error',
        page: pagination?.page || 1,
        limit: pagination?.limit || 10,
        total: 0,
        data: [],
        message: 'Unable to interpret query',
      };
    }

    return this.queryProfiles(filters, undefined, pagination);
  }
}

export const profilesService = new ProfilesService();
