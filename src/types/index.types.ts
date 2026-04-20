// Types for the application

export interface GenderizeResponse {
    name: string;
    gender: string | null;
    probability: number;
    count: number;
}

export interface ProcessedData {
    name: string;
    gender: string;
    probability: number;
    sample_size: number;
    is_confident: boolean;
    processed_at: string;
}

export interface SuccessResponse {
    status: 'success';
    data: ProcessedData;
}

export interface ErrorResponse{
    status: 'error';
    message: string;
}

export type ApiResponse = SuccessResponse | ErrorResponse;

// Stage 1: Profile Types

export interface ProfileData {
    id: string;
    name: string;
    gender: string | null;
    gender_probability: number | null;
    sample_size: number | null;
    age: number | null;
    age_group: string | null;
    country_id: string | null;
    country_name: string | null;
    country_probability: number | null;
    created_at: string;
}

export interface ProfileListItem {
    id: string;
    name: string;
    gender: string | null;
    age: number | null;
    age_group: string | null;
    country_id: string | null;
}

export interface CreateProfileRequest {
    name: string;
}

export interface CreateProfileResponse {
    status: 'success';
    data: ProfileData;
    message?: string;
}

export interface GetProfileResponse {
    status: 'success';
    data: ProfileData;
}

export interface ListProfilesResponse {
    status: 'success';
    count: number;
    data: ProfileListItem[];
}

export interface ProfileFilters {
    gender?: string;
    country_id?: string;
    age_group?: string;
}

// Stage 2: Advanced Query Types

export interface ProfileFilterQuery {
    gender?: string;
    age_group?: string;
    country_id?: string;
    min_age?: number;
    max_age?: number;
    min_gender_probability?: number;
    min_country_probability?: number;
}

export interface SortOptions {
    sort_by?: 'age' | 'created_at' | 'gender_probability';
    order?: 'asc' | 'desc';
}

export interface PaginationParams {
    page?: number;
    limit?: number;
}

export interface PaginatedResponse<T> {
    status: 'success' | 'error';
    page: number;
    limit: number;
    total: number;
    data: T[];
    message?: string;
}

export interface NaturalLanguageQuery {
    q: string;
}
