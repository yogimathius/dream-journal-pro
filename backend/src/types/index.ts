import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    subscriptionStatus: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DreamCreateData {
  title: string;
  content: string;
  dreamDate?: Date;
  sleepTime?: Date;
  wakeTime?: Date;
  sleepQuality?: number;
  lucidity?: number;
  vividness?: number;
  mood?: string;
  wakeUpMood?: string;
  emotions?: string[];
  symbols?: string[];
  people?: string[];
  places?: string[];
  themes?: string[];
  colors?: string[];
  lifeTags?: string[];
  isDraft?: boolean;
}

export interface DreamUpdateData extends Partial<DreamCreateData> {}

export interface UserRegistrationData {
  email: string;
  password: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

export interface UserLoginData {
  email: string;
  password: string;
}

export interface SubscriptionWebhookData {
  type: string;
  data: {
    object: any;
  };
}