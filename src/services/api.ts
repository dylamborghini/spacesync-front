// src/services/api.ts
// Define the API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://310c-137-151-175-115.ngrok-free.app';

// Define response types
interface LoginResponse {
  success: boolean;
  token?: string;
  message?: string;
}

interface TokenValidationResponse {
  valid: boolean;
}

interface StatusResponse {
  availablePhones: number;
  busyPhones: number;
  averageProcessingTime: number;
}

interface Task {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  code: string;
  fileName?: string;
  estimatedCompletionTime?: string;
  result?: any;
  createdAt: string;
}

// API service implementation
export const apiService = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      return data;
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, message: error.message || 'Login failed' };
    }
  },
  
  validateToken: async (): Promise<TokenValidationResponse> => {
    try {
      const token = localStorage.getItem('phoneComputeToken');
      if (!token) {
        return { valid: false };
      }
      
      const response = await fetch(`${API_BASE_URL}/auth/validate`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        return { valid: false };
      }
      
      return { valid: true };
    } catch (error) {
      console.error('Token validation error:', error);
      return { valid: false };
    }
  },
  
  getStatus: async (): Promise<StatusResponse> => {
    try {
      const token = localStorage.getItem('phoneComputeToken');
      
      const response = await fetch(`${API_BASE_URL}/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch status');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching status:', error);
      // Return fallback data if the API fails
      return {
        availablePhones: 0,
        busyPhones: 0,
        averageProcessingTime: 0
      };
    }
  },
  
  getTasks: async (): Promise<Task[]> => {
    try {
      const token = localStorage.getItem('phoneComputeToken');
      
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  },
  
  submitTask: async (code: string, file: File | null): Promise<Task> => {
    try {
      const token = localStorage.getItem('phoneComputeToken');
      const formData = new FormData();
      
      if (code.trim()) {
        formData.append('code', code);
      }
      
      if (file) {
        formData.append('file', file);
      }
      
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit task');
      }
      
      return await response.json();
    } catch (error: any) {
      console.error('Error submitting task:', error);
      throw error;
    }
  }
};