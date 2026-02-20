'use server';

import { createClient } from '@/utils/supabase/server';
import { getCachedAIConfig, revalidateAIConfig } from '@/services/ai-config-server';
import { AIConfig } from '@/services/aiConfig';

export async function getAIConfigAction() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return null;
    }

    // Get tenant
    const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (!tenant) return null;

    // Call the cached service
    return await getCachedAIConfig(tenant.id);
}

export async function saveAIConfigAction(config: Omit<AIConfig, 'id'>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (!tenant) throw new Error('Tenant not found');

    // Update or Insert
    // Check existence first? Or upsert?
    // Helper:
    const { data: existing } = await supabase
        .from('tenant_ai_config')
        .select('id')
        .eq('tenant_id', tenant.id)
        .maybeSingle();

    let result;
    if (existing) {
        result = await supabase
            .from('tenant_ai_config')
            .update({
                question_1: config.question_1,
                question_2: config.question_2,
                question_3: config.question_3,
                question_4: config.question_4,
                question_5: config.question_5,
                additional_details: config.additional_details
            })
            .eq('tenant_id', tenant.id)
            .select()
            .single();
    } else {
        result = await supabase
            .from('tenant_ai_config')
            .insert([{
                tenant_id: tenant.id,
                ...config
            }])
            .select()
            .single();
    }

    if (result.error) throw result.error;

    // Invalidate Cache
    await revalidateAIConfig(tenant.id);

    return result.data;
}
