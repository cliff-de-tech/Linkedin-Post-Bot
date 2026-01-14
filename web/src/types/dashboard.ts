/**
 * Dashboard Types
 * 
 * These types integrate with the auto-generated API contracts.
 * 
 * TO REGENERATE API TYPES:
 * 1. Ensure backend is running: cd backend && python app.py
 * 2. Run: npm run generate:types
 * 
 * The generated types are at: shared/contracts/index.d.ts
 */

// Re-export API types from shared contracts
// Note: These are generated from OpenAPI spec - do not modify directly
export type {
    components,
    paths,
    operations,
} from '@shared/contracts/index';

// Type aliases for commonly used schemas
import type { components } from '@shared/contracts/index';

/** Request body for saving a post */
export type SavePostRequest = components['schemas']['PostCreateRequest'];

/** Request body for batch post generation */
export type BatchGenerateRequest = components['schemas']['BatchGenerateRequest'];

/** Request body for publishing to LinkedIn */
export type FullPublishRequest = components['schemas']['PublishFullRequest'];

/** Request body for scanning GitHub activity */
export type ScanRequest = components['schemas']['ScanRequest'];

/** Request body for scheduling a post */
export type SchedulePostRequest = components['schemas']['ScheduleRequest'];

/** User settings request */
export type UserSettingsRequest = components['schemas']['SettingsRequest'];

/** Image preview request */
export type ImagePreviewRequest = components['schemas']['ImagePreviewRequest'];

// ============================================================================
// Frontend-only types (not in API spec)
// ============================================================================

/**
 * GitHub activity item from scan endpoint
 * Note: This is a frontend representation, the actual API returns generic objects
 */
export interface GitHubActivity {
    id: string;
    type: string;
    icon: string;
    title: string;
    description: string;
    time_ago: string;
    repo: string;
    context: Record<string, unknown>;
}

/**
 * Post item for the dashboard queue
 */
export interface DashboardPost {
    id: string;
    content: string;
    image_url?: string;
    status: 'draft' | 'published' | 'scheduled';
    activity?: GitHubActivity;
}

/**
 * Template option for post generation styles
 */
export interface Template {
    id: string;
    name: string;
    description: string;
    icon: string;
    value: string;
}

/**
 * User stats from analytics endpoint
 */
export interface UserStats {
    total_posts: number;
    published_posts: number;
    draft_posts: number;
    posts_this_month: number;
}

/**
 * Post context for AI generation
 */
export interface PostContext {
    type: string;
    commits?: number;
    total_commits?: number;  // Total commits in the repo (from GitHub API)
    repo?: string;
    full_repo?: string;
    date?: string;
    [key: string]: unknown;
}
