import { Sidebar } from '@/components/dashboard/Sidebar';
import { TierProvider } from '@/contexts/TierContext';
import { createClient } from "@/utils/supabase/server";
import { redirect } from 'next/navigation';
import { SubscriptionGuard } from '@/components/dashboard/SubscriptionGuard';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: tenant } = await supabase
        .from('tenants')
        .select('id, subscription_tier, subscription_status, subscription_end_date')
        .eq('user_id', user.id)
        .single();

    let status = tenant?.subscription_status || 'pending_payment';
    const tier = (tenant?.subscription_tier as 1 | 2) || 1;

    // Check Expiration
    if (status === 'active' && tenant?.subscription_end_date) {
        const endDate = new Date(tenant.subscription_end_date);
        const now = new Date();

        if (now > endDate) {
            status = 'expired';
            // Auto-update DB to expired
            // This is a side-effect in a Server Component, which is generally okay for this kind of "lazy" state update
            await supabase
                .from('tenants')
                .update({ subscription_status: 'expired' })
                .eq('id', tenant.id);
        }
    }

    return (
        <TierProvider initialTier={tier} initialStatus={status}>
            <div className="flex h-screen w-full overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-y-auto bg-background p-8">
                    <SubscriptionGuard status={status}>
                        {children}
                    </SubscriptionGuard>
                </main>
            </div>
        </TierProvider>
    );
}
