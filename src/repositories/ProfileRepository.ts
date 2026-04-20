import { AppDataSource } from '../database';
import { Profile } from '../entities/Profile';
import { ProfileFilterQuery, SortOptions, PaginationParams } from '../types/index.types';
import { v7 as uuidv7 } from 'uuid';

export class ProfileRepository {
  private repository = AppDataSource.getRepository(Profile);

  /**
   * Find a profile by ID
   */
  async findById(id: string): Promise<Profile | null> {
    return this.repository.findOne({ where: { id } });
  }

  /**
   * Find a profile by name (case-insensitive)
   */
  async findByName(name: string): Promise<Profile | null> {
    return this.repository.findOne({
      where: { name_lower: name.toLowerCase() },
    });
  }

  /**
   * Find all profiles with optional filters
   */
  async findAll(filters?: {
    gender?: string;
    country_id?: string;
    age_group?: string;
  }): Promise<Profile[]> {
    let query = this.repository.createQueryBuilder('profile');

    if (filters) {
      if (filters.gender) {
        query = query.where('LOWER(profile.gender) = LOWER(:gender)', {
          gender: filters.gender,
        });
      }
      if (filters.country_id) {
        query = query.andWhere('LOWER(profile.country_id) = LOWER(:country_id)', {
          country_id: filters.country_id,
        });
      }
      if (filters.age_group) {
        query = query.andWhere('LOWER(profile.age_group) = LOWER(:age_group)', {
          age_group: filters.age_group,
        });
      }
    }

    return query.orderBy('profile.created_at', 'DESC').getMany();
  }

  /**
   * Create a new profile
   */
  async create(profile: Partial<Profile>): Promise<Profile> {
    const newProfile = this.repository.create({
      ...profile,
      name_lower: (profile.name || '').toLowerCase(),
    });
    return this.repository.save(newProfile);
  }

  /**
   * Delete a profile by ID
   */
  async deleteById(id: string): Promise<boolean> {
    const result = await this.repository.delete({ id });
    return result.affected ? result.affected > 0 : false;
  }

  /**
   * Check if profile exists by name
   */
  async existsByName(name: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { name_lower: name.toLowerCase() },
    });
    return count > 0;
  }

  /**
   * Count total profiles
   */
  async count(): Promise<number> {
    return this.repository.count();
  }

  /**
   * Find all profiles with advanced filtering, sorting, and pagination
   */
  async findAllAdvanced(
    filters?: ProfileFilterQuery,
    sort?: SortOptions,
    pagination?: PaginationParams
  ): Promise<{ total: number; data: Profile[] }> {
    let query = this.repository.createQueryBuilder('profile');

    // Apply filters
    if (filters) {
      if (filters.gender) {
        query = query.where('LOWER(profile.gender) = LOWER(:gender)', {
          gender: filters.gender,
        });
      }

      if (filters.country_id) {
        query = query.andWhere('LOWER(profile.country_id) = LOWER(:country_id)', {
          country_id: filters.country_id,
        });
      }

      if (filters.age_group) {
        query = query.andWhere('LOWER(profile.age_group) = LOWER(:age_group)', {
          age_group: filters.age_group,
        });
      }

      if (filters.min_age !== undefined) {
        query = query.andWhere('profile.age >= :min_age', {
          min_age: filters.min_age,
        });
      }

      if (filters.max_age !== undefined) {
        query = query.andWhere('profile.age <= :max_age', {
          max_age: filters.max_age,
        });
      }

      if (filters.min_gender_probability !== undefined) {
        query = query.andWhere('profile.gender_probability >= :min_gender_prob', {
          min_gender_prob: filters.min_gender_probability,
        });
      }

      if (filters.min_country_probability !== undefined) {
        query = query.andWhere('profile.country_probability >= :min_country_prob', {
          min_country_prob: filters.min_country_probability,
        });
      }
    }

    // Get total count before pagination
    const total = await query.getCount();

    // Apply sorting
    if (sort?.sort_by) {
      const order = sort.order === 'asc' ? 'ASC' : 'DESC';
      query = query.orderBy(`profile.${sort.sort_by}`, order);
    } else {
      query = query.orderBy('profile.created_at', 'DESC');
    }

    // Apply pagination
    if (pagination?.page && pagination?.limit) {
      const page = Math.max(1, pagination.page);
      const limit = Math.min(50, Math.max(1, pagination.limit));
      const skip = (page - 1) * limit;
      query = query.skip(skip).take(limit);
    }

    const data = await query.getMany();
    return { total, data };
  }

  /**
   * Count profiles matching filters
   */
  async countAdvanced(filters?: ProfileFilterQuery): Promise<number> {
    let query = this.repository.createQueryBuilder('profile');

    if (filters) {
      if (filters.gender) {
        query = query.where('LOWER(profile.gender) = LOWER(:gender)', {
          gender: filters.gender,
        });
      }

      if (filters.country_id) {
        query = query.andWhere('LOWER(profile.country_id) = LOWER(:country_id)', {
          country_id: filters.country_id,
        });
      }

      if (filters.age_group) {
        query = query.andWhere('LOWER(profile.age_group) = LOWER(:age_group)', {
          age_group: filters.age_group,
        });
      }

      if (filters.min_age !== undefined) {
        query = query.andWhere('profile.age >= :min_age', {
          min_age: filters.min_age,
        });
      }

      if (filters.max_age !== undefined) {
        query = query.andWhere('profile.age <= :max_age', {
          max_age: filters.max_age,
        });
      }

      if (filters.min_gender_probability !== undefined) {
        query = query.andWhere('profile.gender_probability >= :min_gender_prob', {
          min_gender_prob: filters.min_gender_probability,
        });
      }

      if (filters.min_country_probability !== undefined) {
        query = query.andWhere('profile.country_probability >= :min_country_prob', {
          min_country_prob: filters.min_country_probability,
        });
      }
    }

    return query.getCount();
  }

  /**
   * Seed profiles from an array, preventing duplicates
   */
  async seedProfiles(
    profiles: any[]
  ): Promise<{ inserted: number; skipped: number; errors: any[] }> {
    let inserted = 0;
    let skipped = 0;
    const errors: any[] = [];

    for (const profile of profiles) {
      try {
        // Check if profile already exists by name (case-insensitive)
        const exists = await this.existsByName(profile.name);
        if (exists) {
          skipped++;
          continue;
        }

        // Create and save the profile
        const newProfile = this.repository.create({
          id: uuidv7(),
          name: profile.name,
          name_lower: profile.name.toLowerCase(),
          gender: profile.gender || null,
          gender_probability: profile.gender_probability || null,
          age: profile.age || null,
          age_group: profile.age_group || null,
          country_id: profile.country_id || null,
          country_name: profile.country_name || null,
          country_probability: profile.country_probability || null,
        });

        await this.repository.save(newProfile);
        inserted++;
      } catch (error) {
        errors.push({ name: profile.name, error });
      }
    }

    return { inserted, skipped, errors };
  }
}

// Export singleton instance
export const profileRepository = new ProfileRepository();
