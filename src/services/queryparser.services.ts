import { ProfileFilterQuery } from '../types/index.types';

/**
 * QueryParser provides rule-based natural language query parsing
 * No AI/LLMs used - pure pattern matching and keyword extraction
 */
export class QueryParser {
  private countryMapping: { [key: string]: string } = {
    // Africa
    'nigeria': 'NG',
    'kenya': 'KE',
    'tanzania': 'TZ',
    'angola': 'AO',
    'benin': 'BJ',
    'botswana': 'BW',
    'burkina faso': 'BF',
    'burundi': 'BI',
    'cameroon': 'CM',
    'cape verde': 'CV',
    'central african republic': 'CF',
    'chad': 'TD',
    'comoros': 'KM',
    'congo': 'CG',
    'democratic republic of congo': 'CD',
    'côte d\'ivoire': 'CI',
    'djibouti': 'DJ',
    'egypt': 'EG',
    'equatorial guinea': 'GQ',
    'eritrea': 'ER',
    'ethiopia': 'ET',
    'gabon': 'GA',
    'gambia': 'GM',
    'ghana': 'GH',
    'guinea': 'GN',
    'guinea-bissau': 'GW',
    'lesotho': 'LS',
    'liberia': 'LR',
    'libya': 'LY',
    'madagascar': 'MG',
    'malawi': 'MW',
    'mali': 'ML',
    'mauritania': 'MR',
    'mauritius': 'MU',
    'morocco': 'MA',
    'mozambique': 'MZ',
    'namibia': 'NA',
    'niger': 'NE',
    'rwanda': 'RW',
    'são tomé and príncipe': 'ST',
    'senegal': 'SN',
    'seychelles': 'SC',
    'sierra leone': 'SL',
    'somalia': 'SO',
    'south africa': 'ZA',
    'south sudan': 'SS',
    'sudan': 'SD',
    'eswatini': 'SZ',
    'uganda': 'UG',
    'zambia': 'ZM',
    'zimbabwe': 'ZW',
  };

  /**
   * Parse natural language query into ProfileFilterQuery
   * @param query - User query string
   * @returns ProfileFilterQuery or null if unparseable
   */
  parseQuery(query: string): ProfileFilterQuery | null {
    if (!query || typeof query !== 'string' || query.trim() === '') {
      return null;
    }

    const lowerQuery = query.toLowerCase().trim();
    const filters: ProfileFilterQuery = {};

    try {
      // Extract gender
      const genderMatch = this.extractGender(lowerQuery);
      if (genderMatch) {
        filters.gender = genderMatch;
      }

      // Extract age group (teenager, adult, senior, child)
      const ageGroupMatch = this.extractAgeGroup(lowerQuery);
      if (ageGroupMatch) {
        filters.age_group = ageGroupMatch;
      }

      // Extract age range
      const ageRangeMatch = this.extractAgeRange(lowerQuery);
      if (ageRangeMatch) {
        if (ageRangeMatch.min !== undefined) {
          filters.min_age = ageRangeMatch.min;
        }
        if (ageRangeMatch.max !== undefined) {
          filters.max_age = ageRangeMatch.max;
        }
      }

      // Extract country
      const countryMatch = this.extractCountry(lowerQuery);
      if (countryMatch) {
        filters.country_id = countryMatch;
      }

      // If we couldn't extract any meaningful filters, return null
      if (Object.keys(filters).length === 0) {
        return null;
      }

      return filters;
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract gender from query
   * @param query - Lowercase query string
   * @returns 'male' | 'female' | undefined
   */
  private extractGender(query: string): 'male' | 'female' | undefined {
    // Match male patterns (including plurals)
    if (/\b(males?|men|boys?)\b/.test(query)) {
      return 'male';
    }

    // Match female patterns (including plurals)
    if (/\b(females?|women?|girls?)\b/.test(query)) {
      return 'female';
    }

    return undefined;
  }

  /**
   * Extract age group from query
   * @param query - Lowercase query string
   * @returns age_group or undefined
   */
  private extractAgeGroup(query: string): string | undefined {
    if (/\b(teenagers?|teens|teenage)\b/.test(query)) {
      return 'teenager';
    }

    if (/\b(adults?)\b/.test(query)) {
      return 'adult';
    }

    if (/\b(seniors?|elderly|old|aged)\b/.test(query)) {
      return 'senior';
    }

    if (/\b(children?|kids?)\b/.test(query)) {
      return 'child';
    }

    return undefined;
  }

  /**
   * Extract age range from query
   * Handles: "above 30", "over 25", "more than 20", "below 50", "under 40", "16-24", "age 30"
   * @param query - Lowercase query string
   * @returns { min?, max? } or undefined
   */
  private extractAgeRange(query: string): { min?: number; max?: number } | undefined {
    const result: { min?: number; max?: number } = {};

    // Handle "above X", "over X", "more than X" patterns
    const aboveMatch = query.match(/\b(above|over|more than)\s+(\d+)/);
    if (aboveMatch) {
      result.min = parseInt(aboveMatch[2], 10);
    }

    // Handle "below X", "under X", "less than X" patterns
    const belowMatch = query.match(/\b(below|under|less than)\s+(\d+)/);
    if (belowMatch) {
      result.max = parseInt(belowMatch[2], 10);
    }

    // Handle "X-Y" range pattern
    const rangeMatch = query.match(/\b(\d+)\s*-\s*(\d+)\b/);
    if (rangeMatch) {
      const num1 = parseInt(rangeMatch[1], 10);
      const num2 = parseInt(rangeMatch[2], 10);
      if (num1 < num2) {
        result.min = num1;
        result.max = num2;
      } else {
        result.min = num2;
        result.max = num1;
      }
    }

    // Handle "age X", "X years old" patterns
    const exactAgeMatch = query.match(/(?:age|aged)\s+(\d+)|\b(\d+)\s+years\s+old\b/);
    if (exactAgeMatch) {
      const age = parseInt(exactAgeMatch[1] || exactAgeMatch[2], 10);
      result.min = age;
      result.max = age;
    }

    // Special case: "young" maps to ages 16-24 (defined in requirements)
    if (/\byoung\b/.test(query) && result.min === undefined && result.max === undefined) {
      result.min = 16;
      result.max = 24;
    }

    return Object.keys(result).length > 0 ? result : undefined;
  }

  /**
   * Extract country from query
   * Looks for patterns like "from COUNTRY", "in COUNTRY", "people from COUNTRY"
   * @param query - Lowercase query string
   * @returns 2-char country code or undefined
   */
  private extractCountry(query: string): string | undefined {
    // Match "from COUNTRY", "in COUNTRY", "people from COUNTRY" patterns
    const countryPatterns = [
      /\bfrom\s+([\w\s'-]+?)(?:\s+(?:and|or)|$)/,
      /\bin\s+([\w\s'-]+?)(?:\s+(?:and|or)|$)/,
      /\bpeople\s+from\s+([\w\s'-]+?)(?:\s+(?:and|or)|$)/,
    ];

    for (const pattern of countryPatterns) {
      const match = query.match(pattern);
      if (match) {
        const countryName = match[1].trim();
        const code = this.countryNameToCode(countryName);
        if (code) {
          return code;
        }
      }
    }

    return undefined;
  }

  /**
   * Convert country name to 2-char code
   * @param name - Country name
   * @returns 2-char country code or null
   */
  countryNameToCode(name: string): string | null {
    const cleaned = name.toLowerCase().trim();
    return this.countryMapping[cleaned] || null;
  }
}

// Export singleton instance
export const queryParser = new QueryParser();
