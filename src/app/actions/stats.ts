'use server';

import { createClient } from '@/utils/supabase/server';
import { getCachedStats } from '@/services/stats-server';

export async function getDashboardStatsAction() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (!tenant) return null;

    return await getCachedStats(tenant.id);
}
