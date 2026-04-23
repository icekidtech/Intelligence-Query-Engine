import { Router, Request, Response } from 'express';
import { profilesService } from '../services/profiles.services';
import { profileRepository } from '../repositories/ProfileRepository';
import { filterService } from '../services/filter.services';
import {
  CreateProfileRequest,
  CreateProfileResponse,
  GetProfileResponse,
  ListProfilesResponse,
  ProfileFilters,
} from '../types/index.types';

const router: any = Router();

/**
 * POST /api/profiles
 * Create a new profile or return existing if name already exists (idempotency)
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name } = req.body as CreateProfileRequest;

    // Validate name is provided
    if (!name) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing or empty name',
      });
    }

    // Validate name is a string
    if (typeof name !== 'string') {
      return res.status(422).json({
        status: 'error',
        message: 'Name must be a string',
      });
    }

    // Trim and validate name is not empty after trimming
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing or empty name',
      });
    }

    // Check if profile already exists (case-insensitive)
    const existingProfile = await profileRepository.findByName(trimmedName);
    if (existingProfile) {
      return res.status(200).json({
        status: 'success',
        message: 'Profile already exists',
        data: {
          id: existingProfile.id,
          name: existingProfile.name,
          gender: existingProfile.gender,
          gender_probability: existingProfile.gender_probability,
          sample_size: existingProfile.sample_size,
          age: existingProfile.age,
          age_group: existingProfile.age_group,
          country_id: existingProfile.country_id,
          country_name: existingProfile.country_name,
          country_probability: existingProfile.country_probability,
          created_at: existingProfile.created_at.toISOString(),
        },
      });
    }

    // Enrich profile with data from external APIs
    const enrichedProfile = await profilesService.enrichProfile(trimmedName);

    // Store in database
    const savedProfile = await profileRepository.create({
      id: enrichedProfile.id,
      name: enrichedProfile.name,
      gender: enrichedProfile.gender,
      gender_probability: enrichedProfile.gender_probability,
      sample_size: enrichedProfile.sample_size,
      age: enrichedProfile.age,
      age_group: enrichedProfile.age_group,
      country_id: enrichedProfile.country_id,
      country_probability: enrichedProfile.country_probability,
    });

    return res.status(201).json({
      status: 'success',
      data: {
        id: savedProfile.id,
        name: savedProfile.name,
        gender: savedProfile.gender,
        gender_probability: savedProfile.gender_probability,
        sample_size: savedProfile.sample_size,
        age: savedProfile.age,
        age_group: savedProfile.age_group,
        country_id: savedProfile.country_id,
        country_name: savedProfile.country_name,
        country_probability: savedProfile.country_probability,
        created_at: savedProfile.created_at.toISOString(),
      },
    } as CreateProfileResponse);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Handle external API failures
    if (errorMessage.includes('Genderize')) {
      return res.status(502).json({
        status: 'error',
        message: 'Genderize returned an invalid response',
      });
    }
    if (errorMessage.includes('Agify')) {
      return res.status(502).json({
        status: 'error',
        message: 'Agify returned an invalid response',
      });
    }
    if (errorMessage.includes('Nationalize')) {
      return res.status(502).json({
        status: 'error',
        message: 'Nationalize returned an invalid response',
      });
    }

    // Handle validation errors
    if (errorMessage.includes('invalid response')) {
      return res.status(502).json({
        status: 'error',
        message: errorMessage,
      });
    }

    // Default error
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
});

/**
 * GET /api/profiles/search
 * Search profiles using natural language query
 * MUST be before /:id route to avoid conflicts
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    // Validate query parameter exists
    if (!q) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing or empty query parameter',
      });
    }

    // Validate query is a string
    if (typeof q !== 'string') {
      return res.status(422).json({
        status: 'error',
        message: 'Query parameter must be a string',
      });
    }

    // Validate pagination parameters
    const pagination = {
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
    };

    // Validate pagination
    const paginationValidation = filterService.validateFilters(pagination);
    if (!paginationValidation.valid) {
      return res.status(422).json({
        status: 'error',
        message: paginationValidation.errors.join('; '),
      });
    }

    const normalizedPagination = filterService.normalizePagination(pagination);

    // Search with natural language
    const result = await profilesService.searchWithNaturalLanguage(
      q.trim(),
      normalizedPagination
    );

    // Convert created_at to ISO string for all profiles
    const data = result.data.map((profile: any) => ({
      ...profile,
      created_at: profile.created_at instanceof Date
        ? profile.created_at.toISOString()
        : profile.created_at,
    }));

    return res.status(200).json({
      status: result.status,
      page: result.page,
      limit: result.limit,
      total: result.total,
      data,
      message: result.message,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
});

/**
 * GET /api/profiles/:id
 * Retrieve a profile by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const profile = await profileRepository.findById(id);
    if (!profile) {
      return res.status(404).json({
        status: 'error',
        message: 'Profile not found',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        id: profile.id,
        name: profile.name,
        gender: profile.gender,
        gender_probability: profile.gender_probability,
        sample_size: profile.sample_size,
        age: profile.age,
        age_group: profile.age_group,
        country_id: profile.country_id,
        country_name: profile.country_name,
        country_probability: profile.country_probability,
        created_at: profile.created_at.toISOString(),
      },
    } as GetProfileResponse);
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
});

/**
 * GET /api/profiles
 * List profiles with optional filtering, sorting, and pagination (enhanced)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Check if this is an advanced query (has filtering parameters beyond basic)
    const hasAdvancedFilters =
      req.query.min_age ||
      req.query.max_age ||
      req.query.min_gender_probability ||
      req.query.min_country_probability ||
      req.query.sort_by ||
      req.query.order ||
      req.query.page ||
      req.query.limit;

    // If it's an advanced query, use the new advanced endpoint
    if (hasAdvancedFilters) {
      // Validate filters
      const validation = filterService.validateFilters(req.query);
      if (!validation.valid) {
        return res.status(422).json({
          status: 'error',
          message: validation.errors.join('; '),
        });
      }

      // Normalize filters
      const filters = filterService.normalizeFilters(req.query);
      const pagination = filterService.normalizePagination(req.query);

      // Build sort options
      const sortOptions = {
        sort_by: req.query.sort_by as 'age' | 'created_at' | 'gender_probability' | undefined,
        order: req.query.order as 'asc' | 'desc' | undefined,
      };

      // Query profiles
      const result = await profilesService.queryProfiles(filters, sortOptions, pagination);

      // Convert created_at to ISO string for all profiles
      const data = result.data.map((profile: any) => ({
        ...profile,
        created_at: profile.created_at instanceof Date
          ? profile.created_at.toISOString()
          : profile.created_at,
      }));

      return res.status(200).json({
        status: result.status,
        page: result.page,
        limit: result.limit,
        total: result.total,
        data,
      });
    }

    // Otherwise, use basic filtering (for backward compatibility)
    const filters: ProfileFilters = {};

    // Extract query parameters (case-insensitive)
    if (req.query.gender) {
      filters.gender = String(req.query.gender).toLowerCase();
    }
    if (req.query.country_id) {
      filters.country_id = String(req.query.country_id).toUpperCase();
    }
    if (req.query.age_group) {
      filters.age_group = String(req.query.age_group).toLowerCase();
    }

    const profiles = await profileRepository.findAll(filters);

    return res.status(200).json({
      status: 'success',
      count: profiles.length,
      data: profiles.map((profile) => ({
        id: profile.id,
        name: profile.name,
        gender: profile.gender,
        age: profile.age,
        age_group: profile.age_group,
        country_id: profile.country_id,
      })),
    } as ListProfilesResponse);
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
});

/**
 * DELETE /api/profiles/:id
 * Delete a profile by ID
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const deleted = await profileRepository.deleteById(id);
    if (!deleted) {
      return res.status(404).json({
        status: 'error',
        message: 'Profile not found',
      });
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
});

export default router;
