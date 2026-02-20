import { createAdminClient } from '@/utils/supabase/server';
import { unstable_cache } from 'next/cache';

export interface DashboardStats {
    totalLeads: number;
    totalOrders: number;
    paidOrders: number;
    totalRevenue: number;
    leadsHot: number;
    leadsWarm: number;
    leadsCold: number;
}

export const getCachedStats = unstable_cache(
    async (tenantId: string) => {
        const supabase = createAdminClient();

        // Fetch Leads Count
        const { count: leadCount } = await supabase
            .from('leads')
            .select('status', { count: 'exact' }) // Select minimal fields
            .eq('tenant_id', tenantId);

        // Fetch Orders
        const { count: orderCount, data: orders } = await supabase
            .from('orders')
            .select('status, total_amount', { count: 'exact' })
            .eq('tenant_id', tenantId);

        // Calculate metrics
        const paidOrders = orders?.filter((o: { status: string; total_amount: number }) => o.status === 'paid') || [];
        const revenue = paidOrders.reduce((sum: number, order: { status: string; total_amount: number }) => sum + (order.total_amount || 0), 0);

        // Mock Lead Scoring distribution (since we don't have real scores yet for all)
        const hot = Math.floor((leadCount || 0) * 0.2);
        const warm = Math.floor((leadCount || 0) * 0.5);
        const cold = (leadCount || 0) - hot - warm;

        return {
            totalLeads: leadCount || 0,
            totalOrders: orderCount || 0,
            paidOrders: paidOrders.length,
            totalRevenue: revenue,
            leadsHot: hot,
            leadsWarm: warm,
            leadsCold: cold
        };
    },
    ['tenant-stats'],
    {
        tags: ['stats'],
        revalidate: 600 // Revalidate every 10 minutes (stats don't need to be instant)
    }
);
