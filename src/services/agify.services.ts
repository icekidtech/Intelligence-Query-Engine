import axios, { AxiosInstance } from 'axios';

export interface AgifyResponse {
  name: string;
  age: number | null;
  count: number;
}

export class AgifyService {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.AGIFY_API_URL || 'https://api.agify.io';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: parseInt(process.env.API_TIMEOUT || '5000', 10),
    });
  }

  /**
   * Get age prediction for a name from Agify API
   */
  async predictAge(name: string): Promise<AgifyResponse> {
    try {
      const response = await this.client.get<AgifyResponse>('/', {
        params: { name: name.trim() },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Agify API error: ${error.message}`);
      }
      throw error;
    }
  }
}

export const agifyService = new AgifyService();
