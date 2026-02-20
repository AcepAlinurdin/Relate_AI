'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateTenantSettings(prevState: any, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Unauthorized' };
    }

    // Get current tenant to check tier
    const { data: tenant } = await supabase
        .from('tenants')
        .select('id, subscription_tier')
        .eq('user_id', user.id)
        .single();

    if (!tenant) {
        return { error: 'Tenant not found' };
    }

    const tier = tenant.subscription_tier;

    // Extract Data
    const waha_url = formData.get('waha_url') as string;
    const telegram_bot_token = formData.get('telegram_bot_token') as string;

    // Payment Data (Only for Tier 2)
    const bank_name = formData.get('bank_name') as string;
    const bank_account_number = formData.get('bank_account_number') as string;
    const bank_account_holder = formData.get('bank_account_holder') as string;

    const updates: any = {
        waha_url: waha_url || null,
        telegram_bot_token: telegram_bot_token || null,
    };

    // Strict Tier Check for Payment Info
    if (tier === 2) {
        updates.bank_name = bank_name || null;
        updates.bank_account_number = bank_account_number || null;
        updates.bank_account_holder = bank_account_holder || null;
    }

    const { error } = await supabase
        .from('tenants')
        .update(updates)
        .eq('id', tenant.id);

    if (error) {
        return { error: 'Failed to update settings: ' + error.message };
    }

    revalidatePath('/dashboard/settings');
    return { success: 'Settings updated successfully!' };
}
