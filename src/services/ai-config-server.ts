import { createAdminClient } from '@/utils/supabase/server';
import { unstable_cache } from 'next/cache';
import { revalidateTag } from 'next/cache';
import { AIConfig } from './aiConfig'; // Import type

export const getCachedAIConfig = unstable_cache(
    async (tenantId: string) => {
        const supabase = createAdminClient();

        // Fetch config for the specific tenant
        // Note: This relies on the current session having access OR the table being public readable.
        // If RLS is strict, this might fail if the cache revalidation happens without user context.
        // However, for the first fetch (miss), it uses the request's session.
        const { data, error } = await supabase
            .from('tenant_ai_config')
            .select('*')
            .eq('tenant_id', tenantId)
            .maybeSingle();

        if (error) {
            console.error(`Error fetching AI config for tenant ${tenantId}:`, error);
            return null;
        }

        return data as AIConfig | null;
    },
    ['tenant-ai-config'], // Base key
    {
        tags: ['ai-config'], // General tag
        revalidate: 3600 // Revalidate every hour at most
    }
);

export async function revalidateAIConfig(tenantId: string) {
    // In a real app we'd use more specific tags like `ai-config-${tenantId}`
    // But for now, we'll revalidate the cache key or general tag.
    // unstable_cache keys are hashed. 
    // To properly invalidate specific tenant, we should include tenantId in tags.
    revalidateTag('ai-config'); // This invalidates ALL AI configs. Good enough for low traffic MVP.
}
