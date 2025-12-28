/**
 * useDashboardData - Custom hook for dashboard data fetching with React Query
 * 
 * Features:
 * - Automatic caching and background refetching
 * - User-scoped queries with userId in query key
 * - Parallel data fetching with Promise.all behavior
 * - Type-safe response handling
 */
import { useQuery, useQueries } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ============================================================================
// TYPES
// ============================================================================

export interface DashboardStats {
    posts_generated: number;
    credits_remaining: number;
    posts_published: number;
    posts_this_month: number;
    posts_this_week: number;
    posts_last_week: number;
    growth_percentage: number;
    draft_posts: number;
}

export interface UsageData {
    tier: string;
    posts_today: number;
    posts_limit: number;
    posts_remaining: number;
    scheduled_count: number;
    scheduled_limit: number;
    scheduled_remaining: number;
    resets_in_seconds: number;
    resets_at: string | null;
}

export interface Post {
    id: string | number;
    post_content: string;
    post_type?: string;
    context?: Record<string, unknown>;
    status?: string;
    created_at: number;
    published_at?: number;
}

export interface Template {
    id: string;
    name: string;
    description: string;
    icon: string;
    context?: Record<string, unknown>;
}

export interface GitHubActivity {
    id: string;
    title: string;
    description: string;
    type: string;
    timestamp: string;
    repo?: string;
    url?: string;
    context: Record<string, unknown>;
}

// ============================================================================
// FETCH FUNCTIONS
// ============================================================================

async function fetchStats(userId: string, getToken: () => Promise<string | null>): Promise<DashboardStats> {
    const token = await getToken();
    const response = await axios.get(`${API_BASE}/api/stats/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
}

async function fetchPostHistory(userId: string, getToken: () => Promise<string | null>, limit = 10): Promise<Post[]> {
    const token = await getToken();
    const response = await axios.get(`${API_BASE}/api/posts/${userId}?limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.posts || [];
}

async function fetchUsage(userId: string, getToken: () => Promise<string | null>): Promise<UsageData | null> {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const token = await getToken();
    const response = await axios.get(`${API_BASE}/api/usage/${userId}`, {
        params: { timezone },
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data?.usage || response.data || null;
}

async function fetchTemplates(): Promise<Template[]> {
    const response = await axios.get(`${API_BASE}/api/templates`);
    return response.data.templates || [];
}

async function fetchGitHubActivity(username: string): Promise<GitHubActivity[]> {
    if (!username) return [];
    const response = await axios.get(`${API_BASE}/api/github/activity/${username}`);
    return response.data.activities || [];
}

async function fetchUserSettings(userId: string, getToken: () => Promise<string | null>): Promise<{ github_username?: string }> {
    const token = await getToken();
    const response = await axios.get(`${API_BASE}/api/settings/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data || {};
}

// ============================================================================
// MAIN HOOK
// ============================================================================

interface UseDashboardDataOptions {
    userId: string;
    enabled?: boolean;
}

export function useDashboardData({ userId, enabled = true }: UseDashboardDataOptions) {
    const { getToken } = useAuth();

    // Fetch user settings first to get GitHub username
    const settingsQuery = useQuery({
        queryKey: ['settings', userId],
        queryFn: () => fetchUserSettings(userId, getToken),
        enabled: enabled && !!userId,
        staleTime: 1000 * 60 * 10, // 10 minutes
    });

    const githubUsername = settingsQuery.data?.github_username || '';

    // Parallel queries for dashboard data
    const statsQuery = useQuery({
        queryKey: ['dashboard', 'stats', userId],
        queryFn: () => fetchStats(userId, getToken),
        enabled: enabled && !!userId,
        staleTime: 1000 * 60 * 2, // 2 minutes
    });

    const postsQuery = useQuery({
        queryKey: ['dashboard', 'posts', userId],
        queryFn: () => fetchPostHistory(userId, getToken),
        enabled: enabled && !!userId,
        staleTime: 1000 * 60 * 2, // 2 minutes
    });

    const usageQuery = useQuery({
        queryKey: ['dashboard', 'usage', userId],
        queryFn: () => fetchUsage(userId, getToken),
        enabled: enabled && !!userId,
        staleTime: 1000 * 60, // 1 minute (usage changes more frequently)
    });

    const templatesQuery = useQuery({
        queryKey: ['templates'],
        queryFn: fetchTemplates,
        enabled,
        staleTime: 1000 * 60 * 30, // 30 minutes (templates rarely change)
    });

    const githubQuery = useQuery({
        queryKey: ['github', 'activity', githubUsername],
        queryFn: () => fetchGitHubActivity(githubUsername),
        enabled: enabled && !!githubUsername,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // Computed values
    const isLoading = statsQuery.isLoading || postsQuery.isLoading || usageQuery.isLoading;
    const isError = statsQuery.isError || postsQuery.isError || usageQuery.isError;

    // Default stats
    const defaultStats: DashboardStats = {
        posts_generated: 0,
        credits_remaining: 50,
        posts_published: 0,
        posts_this_month: 0,
        posts_this_week: 0,
        posts_last_week: 0,
        growth_percentage: 0,
        draft_posts: 0
    };

    return {
        // Data
        stats: statsQuery.data || defaultStats,
        posts: postsQuery.data || [],
        usage: usageQuery.data || null,
        templates: templatesQuery.data || [],
        githubActivities: githubQuery.data || [],
        githubUsername,

        // Loading states
        isLoading,
        isLoadingStats: statsQuery.isLoading,
        isLoadingPosts: postsQuery.isLoading,
        isLoadingUsage: usageQuery.isLoading,
        isLoadingGithub: githubQuery.isLoading,

        // Error states
        isError,
        errors: {
            stats: statsQuery.error,
            posts: postsQuery.error,
            usage: usageQuery.error,
            github: githubQuery.error,
        },

        // Refetch functions
        refetchStats: statsQuery.refetch,
        refetchPosts: postsQuery.refetch,
        refetchUsage: usageQuery.refetch,
        refetchGithub: githubQuery.refetch,
        refetchAll: async () => {
            await Promise.all([
                statsQuery.refetch(),
                postsQuery.refetch(),
                usageQuery.refetch(),
                githubQuery.refetch(),
            ]);
        },
    };
}

// ============================================================================
// INDIVIDUAL HOOKS (for components that only need specific data)
// ============================================================================

export function useStats(userId: string, enabled = true) {
    const { getToken } = useAuth();
    return useQuery({
        queryKey: ['dashboard', 'stats', userId],
        queryFn: () => fetchStats(userId, getToken),
        enabled: enabled && !!userId,
        staleTime: 1000 * 60 * 2,
    });
}

export function usePostHistory(userId: string, enabled = true) {
    const { getToken } = useAuth();
    return useQuery({
        queryKey: ['dashboard', 'posts', userId],
        queryFn: () => fetchPostHistory(userId, getToken),
        enabled: enabled && !!userId,
        staleTime: 1000 * 60 * 2,
    });
}

export function useUsage(userId: string, enabled = true) {
    const { getToken } = useAuth();
    return useQuery({
        queryKey: ['dashboard', 'usage', userId],
        queryFn: () => fetchUsage(userId, getToken),
        enabled: enabled && !!userId,
        staleTime: 1000 * 60,
    });
}

export function useGitHubActivity(username: string, enabled = true) {
    return useQuery({
        queryKey: ['github', 'activity', username],
        queryFn: () => fetchGitHubActivity(username),
        enabled: enabled && !!username,
        staleTime: 1000 * 60 * 5,
    });
}
