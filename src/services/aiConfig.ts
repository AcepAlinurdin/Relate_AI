import { supabase } from '@/lib/supabase';

export interface AIConfig {
    id?: string;
    question_1: string;
    question_2: string;
    question_3: string;
    question_4: string;
    question_5: string;
    additional_details: string;
}

export const aiConfigService = {
    async getConfig() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // First get the tenant_id for the user
        const { data: tenant } = await supabase
            .from('tenants')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (!tenant) throw new Error('Tenant not found');

        const { data, error } = await supabase
            .from('tenant_ai_config')
            .select('*')
            .eq('tenant_id', tenant.id)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
            throw error;
        }

        return data as AIConfig | null;
    },

    async saveConfig(config: Omit<AIConfig, 'id'>) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data: tenant } = await supabase
            .from('tenants')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (!tenant) throw new Error('Tenant not found');

        // Check if config exists
        const existing = await this.getConfig();

        if (existing) {
            const { data, error } = await supabase
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

            if (error) throw error;
            return data;
        } else {
            const { data, error } = await supabase
                .from('tenant_ai_config')
                .insert([{
                    tenant_id: tenant.id,
                    question_1: config.question_1,
                    question_2: config.question_2,
                    question_3: config.question_3,
                    question_4: config.question_4,
                    question_5: config.question_5,
                    additional_details: config.additional_details
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        }
    }
};
