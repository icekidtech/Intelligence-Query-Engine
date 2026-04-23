import { ProfileFilterQuery, PaginationParams } from '../types/index.types';

/**
 * FilterService handles validation and normalization of query filters
 */
export class FilterService {
  /**
   * Validate filter parameters
   * @param params - Raw query parameters
   * @returns { valid: boolean, errors: string[] }
   */
  validateFilters(params: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Gender validation
    if (params.gender !== undefined) {
      if (typeof params.gender !== 'string') {
        errors.push('gender must be a string');
      } else {
        const validGenders = ['male', 'female'];
        if (!validGenders.includes(params.gender.toLowerCase())) {
          errors.push('gender must be one of: male, female');
        }
      }
    }

    // Age group validation
    if (params.age_group !== undefined) {
      if (typeof params.age_group !== 'string') {
        errors.push('age_group must be a string');
      } else {
        const validAgeGroups = ['child', 'teenager', 'adult', 'senior'];
        if (!validAgeGroups.includes(params.age_group.toLowerCase())) {
          errors.push('age_group must be one of: child, teenager, adult, senior');
        }
      }
    }

    // Country ID validation
    if (params.country_id !== undefined && typeof params.country_id !== 'string') {
      errors.push('country_id must be a string');
    }

    // Min age validation
    if (params.min_age !== undefined) {
      const minAge = parseInt(params.min_age, 10);
      if (isNaN(minAge) || minAge < 0 || minAge > 150) {
        errors.push('min_age must be a number between 0 and 150');
      }
    }

    // Max age validation
    if (params.max_age !== undefined) {
      const maxAge = parseInt(params.max_age, 10);
      if (isNaN(maxAge) || maxAge < 0 || maxAge > 150) {
        errors.push('max_age must be a number between 0 and 150');
      }
    }

    // Age range validation
    if (params.min_age !== undefined && params.max_age !== undefined) {
      const minAge = parseInt(params.min_age, 10);
      const maxAge = parseInt(params.max_age, 10);
      if (minAge > maxAge) {
        errors.push('min_age cannot be greater than max_age');
      }
    }

    // Min gender probability validation
    if (params.min_gender_probability !== undefined) {
      const prob = parseFloat(params.min_gender_probability);
      if (isNaN(prob) || prob < 0 || prob > 1) {
        errors.push('min_gender_probability must be a number between 0 and 1');
      }
    }

    // Min country probability validation
    if (params.min_country_probability !== undefined) {
      const prob = parseFloat(params.min_country_probability);
      if (isNaN(prob) || prob < 0 || prob > 1) {
        errors.push('min_country_probability must be a number between 0 and 1');
      }
    }

    // Pagination validation
    if (params.page !== undefined) {
      const page = parseInt(params.page, 10);
      if (isNaN(page) || page < 1) {
        errors.push('page must be a number >= 1');
      }
    }

    if (params.limit !== undefined) {
      const limit = parseInt(params.limit, 10);
      if (isNaN(limit) || limit < 1 || limit > 50) {
        errors.push('limit must be a number between 1 and 50');
      }
    }

    // Sorting validation
    if (params.sort_by !== undefined) {
      const validSortFields = ['age', 'created_at', 'gender_probability'];
      if (!validSortFields.includes(params.sort_by)) {
        errors.push('sort_by must be one of: age, created_at, gender_probability');
      }
    }

    if (params.order !== undefined) {
      const validOrders = ['asc', 'desc'];
      if (!validOrders.includes(params.order?.toLowerCase())) {
        errors.push('order must be one of: asc, desc');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Normalize filter parameters to correct types
   * @param params - Raw query parameters
   * @returns Normalized ProfileFilterQuery
   */
  normalizeFilters(params: any): ProfileFilterQuery {
    const normalized: ProfileFilterQuery = {};

    if (params.gender) {
      normalized.gender = params.gender.toLowerCase().trim();
    }

    if (params.age_group) {
      normalized.age_group = params.age_group.toLowerCase().trim();
    }

    if (params.country_id) {
      normalized.country_id = params.country_id.toUpperCase().trim();
    }

    if (params.min_age !== undefined) {
      normalized.min_age = parseInt(params.min_age, 10);
    }

    if (params.max_age !== undefined) {
      normalized.max_age = parseInt(params.max_age, 10);
    }

    if (params.min_gender_probability !== undefined) {
      normalized.min_gender_probability = parseFloat(params.min_gender_probability);
    }

    if (params.min_country_probability !== undefined) {
      normalized.min_country_probability = parseFloat(params.min_country_probability);
    }

    return normalized;
  }

  /**
   * Normalize pagination parameters
   * @param params - Raw query parameters
   * @returns Normalized PaginationParams
   */
  normalizePagination(params: any): PaginationParams {
    const normalized: PaginationParams = {
      page: 1,
      limit: 10,
    };

    if (params.page !== undefined) {
      const page = parseInt(params.page, 10);
      normalized.page = Math.max(1, page);
    }

    if (params.limit !== undefined) {
      const limit = parseInt(params.limit, 10);
      normalized.limit = Math.min(50, Math.max(1, limit));
    }

    return normalized;
  }
}

// Export singleton instance
export const filterService = new FilterService();
