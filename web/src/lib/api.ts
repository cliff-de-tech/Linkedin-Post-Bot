/**
 * API Utility Module
 * 
 * Provides functions for making API calls to the backend.
 * These functions handle authentication via bearer tokens and standardize API communication.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Context for post generation - can be a string or structured object
 */
export type PostContextInput = string | Record<string, unknown>;

export interface GeneratePreviewRequest {
  context?: PostContextInput;
  user_id: string;
  model?: string;
}

export interface GeneratePreviewResponse {
  post: string;
  provider?: string;
  was_downgraded?: boolean;
}

export interface PublishPostRequest {
  user_id?: string;
  post_content?: string;
  image_url?: string;
  test_mode?: boolean;
  post_id?: string;
  context?: PostContextInput;  // PostContext object for publishing
}

export interface PublishPostResponse {
  success?: boolean;
  error?: string;
  post_url?: string;
  post?: string;  // Generated post content (when test_mode is true)
}

export interface SchedulePostRequest {
  user_id: string;
  post_content: string;
  scheduled_time: string | number;  // Can be timestamp or ISO string
  image_url?: string;
}

export interface SchedulePostResponse {
  success?: boolean;
  error?: string;
  scheduled_id?: string;
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Generate a post preview using AI
 * 
 * @param request - The preview generation request
 * @param token - Optional authentication token
 * @returns Promise with the generated preview
 */
export async function generatePreview(
  request: GeneratePreviewRequest,
  token?: string
): Promise<GeneratePreviewResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/api/post/generate-preview`, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate preview: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Publish a post to LinkedIn
 * 
 * @param request - The publish request
 * @param token - Optional authentication token
 * @returns Promise with the publish result
 */
export async function publishPost(
  request: PublishPostRequest,
  token?: string
): Promise<PublishPostResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/api/publish/full`, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to publish post: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Schedule a post for future publication
 * 
 * @param request - The schedule request
 * @param token - Optional authentication token
 * @returns Promise with the scheduling result
 */
export async function schedulePost(
  request: SchedulePostRequest,
  token?: string
): Promise<SchedulePostResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/api/scheduled`, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to schedule post: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Handle LinkedIn OAuth callback (stub for compatibility)
 * This function is imported but not currently used in the codebase.
 * 
 * @deprecated This function is not implemented. Do not call it.
 * @returns Promise that logs a warning and resolves
 */
export async function handleLinkedInCallback(): Promise<void> {
  console.warn('handleLinkedInCallback is not implemented and should not be called');
  return Promise.resolve();
}

// =============================================================================
// AXIOS-LIKE API CLIENT
// =============================================================================

/**
 * Generic HTTP request interface compatible with axios
 */
interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, any>;
}

/**
 * Generic HTTP GET request
 * 
 * @param url - The URL to fetch
 * @param config - Request configuration
 * @returns Promise with response object
 */
async function get(url: string, config?: RequestConfig): Promise<{ data: any }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...config?.headers,
  };

  let fullUrl = `${API_BASE}${url}`;
  
  // Add query parameters if provided
  if (config?.params) {
    const params = new URLSearchParams();
    Object.entries(config.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    const queryString = params.toString();
    if (queryString) {
      fullUrl += `?${queryString}`;
    }
  }

  const response = await fetch(fullUrl, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }

  const data = await response.json();
  return { data };
}

/**
 * Generic HTTP POST request
 * 
 * @param url - The URL to post to
 * @param body - The request body
 * @param config - Request configuration
 * @returns Promise with response object
 */
async function post(url: string, body?: any, config?: RequestConfig): Promise<{ data: any }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...config?.headers,
  };

  const response = await fetch(`${API_BASE}${url}`, {
    method: 'POST',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`Failed to post to ${url}: ${response.statusText}`);
  }

  const data = await response.json();
  return { data };
}

/**
 * Default export with axios-like interface
 */
export const api = {
  get,
  post,
  generatePreview,
  publishPost,
  schedulePost,
};

export default api;
