import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api' 
  : 'https://dream-journal-api.fly.dev/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Auth interfaces
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    subscriptionStatus: string;
  };
  token: string;
  refreshToken?: string;
}

// Dream interfaces
export interface CreateDreamRequest {
  title: string;
  content: string;
  mood: string;
  tags?: string[];
  isLucid?: boolean;
  voiceRecording?: {
    uri: string;
    duration: number;
    size: number;
  };
}

export interface UpdateDreamRequest extends Partial<CreateDreamRequest> {
  id: string;
}

class ApiClient {
  private baseURL: string;
  private authToken: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.loadAuthToken();
  }

  private async loadAuthToken() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      this.authToken = token;
    } catch (error) {
      console.error('Failed to load auth token:', error);
    }
  }

  private async saveAuthToken(token: string) {
    try {
      await AsyncStorage.setItem('authToken', token);
      this.authToken = token;
    } catch (error) {
      console.error('Failed to save auth token:', error);
    }
  }

  private async removeAuthToken() {
    try {
      await AsyncStorage.removeItem('authToken');
      this.authToken = null;
    } catch (error) {
      console.error('Failed to remove auth token:', error);
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add auth header if token exists
    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      console.log(`Making API request: ${options.method || 'GET'} ${url}`);
      
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Handle 401 unauthorized - token expired
        if (response.status === 401) {
          await this.removeAuthToken();
          throw new Error('Authentication required');
        }
        
        throw new Error(data.error || data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error(`API request failed: ${url}`, error);
      
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      
      throw error;
    }
  }

  // Auth Methods
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.makeRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data?.token) {
      await this.saveAuthToken(response.data.token);
    }

    return response.data!;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await this.makeRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.success && response.data?.token) {
      await this.saveAuthToken(response.data.token);
    }

    return response.data!;
  }

  async logout(): Promise<void> {
    try {
      await this.makeRequest('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      await this.removeAuthToken();
    }
  }

  async getProfile(): Promise<any> {
    const response = await this.makeRequest('/auth/profile');
    return response.data;
  }

  // Dream Methods
  async getDreams(params?: { 
    page?: number; 
    limit?: number; 
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const endpoint = `/dreams${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await this.makeRequest(endpoint);
    return response.data;
  }

  async getDream(id: string): Promise<any> {
    const response = await this.makeRequest(`/dreams/${id}`);
    return response.data;
  }

  async createDream(dreamData: CreateDreamRequest): Promise<any> {
    const response = await this.makeRequest('/dreams', {
      method: 'POST',
      body: JSON.stringify(dreamData),
    });
    return response.data;
  }

  async updateDream(dreamData: UpdateDreamRequest): Promise<any> {
    const { id, ...updateData } = dreamData;
    const response = await this.makeRequest(`/dreams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    return response.data;
  }

  async deleteDream(id: string): Promise<void> {
    await this.makeRequest(`/dreams/${id}`, {
      method: 'DELETE',
    });
  }

  // Dream Analysis
  async analyzeDream(dreamId: string): Promise<any> {
    const response = await this.makeRequest(`/dreams/${dreamId}/analyze`, {
      method: 'POST',
    });
    return response.data;
  }

  async getPatterns(userId?: string): Promise<any> {
    const response = await this.makeRequest('/patterns' + (userId ? `?userId=${userId}` : ''));
    return response.data;
  }

  // Voice Recording Methods
  async uploadVoiceRecording(formData: FormData): Promise<any> {
    // Don't set Content-Type for FormData - let the browser set it
    const response = await this.makeRequest('/voice/upload', {
      method: 'POST',
      headers: this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {},
      body: formData,
    });
    return response.data;
  }

  async getVoiceRecordings(params?: { page?: number; limit?: number }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const endpoint = `/voice${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await this.makeRequest(endpoint);
    return response.data;
  }

  async transcribeVoice(recordingId: string): Promise<any> {
    const response = await this.makeRequest(`/voice/${recordingId}/transcribe`, {
      method: 'POST',
    });
    return response.data;
  }

  // Subscription Methods
  async getSubscriptionStatus(): Promise<any> {
    const response = await this.makeRequest('/subscription/status');
    return response.data;
  }

  async createSubscription(priceId: string): Promise<any> {
    const response = await this.makeRequest('/subscription/create', {
      method: 'POST',
      body: JSON.stringify({ priceId }),
    });
    return response.data;
  }

  async cancelSubscription(immediate: boolean = false): Promise<any> {
    const response = await this.makeRequest('/subscription/cancel', {
      method: 'POST',
      body: JSON.stringify({ immediate }),
    });
    return response.data;
  }

  async updateSubscription(priceId: string): Promise<any> {
    const response = await this.makeRequest('/subscription/update', {
      method: 'POST',
      body: JSON.stringify({ priceId }),
    });
    return response.data;
  }

  // Settings Methods
  async getSettings(): Promise<any> {
    const response = await this.makeRequest('/settings');
    return response.data;
  }

  async updateSettings(settings: any): Promise<any> {
    const response = await this.makeRequest('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL.replace('/api', '')}/health`);
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;