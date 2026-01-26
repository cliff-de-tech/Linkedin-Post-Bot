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

export interface GeneratePreviewRequest {
  context?: string;
  user_id: string;
  model?: string;
}

export interface GeneratePreviewResponse {
  post: string;
  provider?: string;
  was_downgraded?: boolean;
}

export interface PublishPostRequest {
  user_id: string;
  post_content: string;
  image_url?: string;
  test_mode?: boolean;
  post_id?: string;
}

export interface PublishPostResponse {
  success?: boolean;
  error?: string;
  post_url?: string;
}

export interface SchedulePostRequest {
  user_id: string;
  post_content: string;
  scheduled_time: string;
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
 * Default export for backward compatibility
 */
export const api = {
  generatePreview,
  publishPost,
  schedulePost,
};

export default api;
