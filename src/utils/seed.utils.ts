import * as fs from 'fs';
import * as path from 'path';

export interface SeedProfileData {
  name: string;
  gender: string;
  gender_probability: number;
  age: number;
  age_group: string;
  country_id: string;
  country_name: string;
  country_probability: number;
}

export interface SeedFileData {
  profiles: SeedProfileData[];
}

/**
 * Load seed profiles from JSON file
 * @param filePath - Path to seed_profiles.json
 * @returns Array of seed profile data
 */
export function loadSeedProfiles(filePath: string): SeedProfileData[] {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data: SeedFileData = JSON.parse(fileContent);
    return data.profiles || [];
  } catch (error) {
    console.error(`Failed to load seed profiles from ${filePath}:`, error);
    return [];
  }
}

/**
 * Validate seed profile data
 * @param profile - Profile data to validate
 * @returns true if valid, false otherwise
 */
export function validateSeedProfile(profile: any): profile is SeedProfileData {
  return (
    profile.name &&
    typeof profile.name === 'string' &&
    profile.gender &&
    typeof profile.gender === 'string' &&
    typeof profile.gender_probability === 'number' &&
    typeof profile.age === 'number' &&
    profile.age_group &&
    typeof profile.age_group === 'string' &&
    profile.country_id &&
    typeof profile.country_id === 'string' &&
    profile.country_name &&
    typeof profile.country_name === 'string' &&
    typeof profile.country_probability === 'number'
  );
}

/**
 * Get the path to the seed file relative to the project root
 * @returns Full path to seed_profiles.json
 */
export function getSeedFilePath(): string {
  return path.join(process.cwd(), 'seed_profiles.json');
}
