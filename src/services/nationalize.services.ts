import axios, { AxiosInstance } from 'axios';

export interface CountryData {
  country_id: string;
  probability: number;
}

export interface NationalizeResponse {
  name: string;
  country: CountryData[];
}

export class NationalizeService {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NATIONALIZE_API_URL || 'https://api.nationalize.io';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: parseInt(process.env.API_TIMEOUT || '5000', 10),
    });
  }

  /**
   * Get nationality prediction for a name from Nationalize API
   */
  async predictNationality(name: string): Promise<NationalizeResponse> {
    try {
      const response = await this.client.get<NationalizeResponse>('/', {
        params: { name: name.trim() },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Nationalize API error: ${error.message}`);
      }
      throw error;
    }
  }
}

export const nationalizeService = new NationalizeService();
