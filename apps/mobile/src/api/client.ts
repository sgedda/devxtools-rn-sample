import Constants from 'expo-constants';
import type { Task, TasksResponse, TaskResponse, CreateTaskRequest } from '@devxtools/shared';
import { Platform } from 'react-native';

// Safely access EXPO_PUBLIC_API_URL
declare const process: {
  env: {
    EXPO_PUBLIC_API_URL?: string;
  };
};

// Declare React Native globals
declare const __DEV__: boolean;
declare type RequestInit = {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  signal?: AbortSignal;
};

// Request logging callback
type RequestLogCallback = (entry: {
  id: string;
  timestamp: number;
  method: string;
  url: string;
  status?: number;
  duration?: number;
  source?: 'real' | 'msw';
  scenario?: string;
}) => void;

let requestLogCallback: RequestLogCallback | null = null;

export function setRequestLogCallback(callback: RequestLogCallback | null) {
  requestLogCallback = callback;
}

// Get current data source and scenario for stamping requests
type DataSourceGetter = () => { source: 'real' | 'msw' | 'mockifyer'; scenario: string | null };
let dataSourceGetter: DataSourceGetter | null = null;

export function setDataSourceGetter(getter: DataSourceGetter | null) {
  dataSourceGetter = getter;
}

function getApiUrl(): string {
  // Use EXPO_PUBLIC_API_URL if set
  const envApiUrl = typeof process !== 'undefined' ? process.env.EXPO_PUBLIC_API_URL : undefined;
  if (envApiUrl) {
    return envApiUrl;
  }

  // In development, use hostUri from Constants
  const isDev = __DEV__;
  if (isDev && Constants.expoConfig?.hostUri) {
    const host = Constants.expoConfig.hostUri.split(':')[0];
    // Use 10.0.2.2 for Android emulator localhost
    const devHost = Platform.OS === 'android' && host === 'localhost' ? '10.0.2.2' : host;
    return `http://${devHost}:3000`;
  }

  // Fallback
  return 'http://localhost:3000';
}

const API_BASE_URL = getApiUrl();
const REQUEST_TIMEOUT = 10000; // 10 seconds

class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  // Log the request
  const requestId = Math.random().toString(36).substring(7);
  const startTime = Date.now();
  const method = options.method || 'GET';

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    // Get the source and scenario at response time
    const contextData = dataSourceGetter?.() || { source: 'real', scenario: null };
    const source = contextData.source === 'mockifyer' ? 'real' : contextData.source;

    // Log the response
    const duration = Date.now() - startTime;
    if (requestLogCallback) {
      requestLogCallback({
        id: requestId,
        timestamp: startTime,
        method,
        url,
        status: response.status,
        duration,
        source,
        scenario: contextData.scenario || undefined,
      });
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    // Log the error
    const duration = Date.now() - startTime;
    if (requestLogCallback) {
      requestLogCallback({
        id: requestId,
        timestamp: startTime,
        method,
        url,
        duration,
      });
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('Request timed out. Please check your connection.');
    }
    throw error;
  }
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async getTasks(): Promise<Task[]> {
    try {
      const response = await fetchWithTimeout(`${this.baseUrl}/tasks`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message =
          typeof errorData === 'object' && errorData && 'error' in errorData
            ? String(errorData.error)
            : `Failed to fetch tasks (${response.status})`;
        throw new ApiError(message, response.status, errorData);
      }

      const data: TasksResponse = await response.json();
      return data.tasks;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(`Couldn't load tasks. Please check your network connection.`);
    }
  }

  async createTask(title: string): Promise<Task> {
    const body: CreateTaskRequest = { title };

    try {
      const response = await fetchWithTimeout(`${this.baseUrl}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message =
          typeof errorData === 'object' && errorData && 'error' in errorData
            ? String(errorData.error)
            : `Failed to create task (${response.status})`;
        throw new ApiError(message, response.status, errorData);
      }

      const data: TaskResponse = await response.json();
      return data.task;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to create task. Please try again.');
    }
  }

  async toggleTask(id: string, completed: boolean): Promise<Task> {
    try {
      const response = await fetchWithTimeout(`${this.baseUrl}/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message =
          typeof errorData === 'object' && errorData && 'error' in errorData
            ? String(errorData.error)
            : `Failed to update task (${response.status})`;
        throw new ApiError(message, response.status, errorData);
      }

      const data: TaskResponse = await response.json();
      return data.task;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to update task. Please try again.');
    }
  }

  async deleteTask(id: string): Promise<void> {
    try {
      const response = await fetchWithTimeout(`${this.baseUrl}/tasks/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message =
          typeof errorData === 'object' && errorData && 'error' in errorData
            ? String(errorData.error)
            : `Failed to delete task (${response.status})`;
        throw new ApiError(message, response.status, errorData);
      }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to delete task. Please try again.');
    }
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }
}

export const apiClient = new ApiClient();
export { API_BASE_URL, ApiError };
