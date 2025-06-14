// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    nationality: string;
    is_host: boolean;
    is_agent: boolean;
    is_verified: boolean;
    is_active: boolean;
    created_at: string;
  };
  token: string;
}

export interface VerificationResponse {
  message: string;
  token?: string;
}

export interface ResendVerificationResponse {
  message: string;
} 