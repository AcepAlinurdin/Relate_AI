import { createAdminClient } from "@/utils/supabase/server";

export class WhatsappService {
    private supabase;

    constructor() {
        this.supabase = createAdminClient();
    }

    // Send message via WAHA API
    async sendMessage(tenantId: string, to: string, message: string) {
        // 1. Get Channel Config for this Tenant
        const { data: channel, error } = await this.supabase
            .from('channels')
            .select('config')
            .eq('tenant_id', tenantId)
            .eq('type', 'wa_waha')
            .eq('is_active', true)
            .single();

        if (error || !channel) {
            console.error(`[WhatsappService] No active WAHA channel found for tenant ${tenantId}`);
            return false;
        }

        const config = channel.config as any;
        const wahaUrl = config.url || process.env.WAHA_API_URL || 'http://localhost:3000';
        const sessionName = config.session_name || 'default'; // WAHA session

        try {
            // Adjust based on your WAHA version/endpoint
            // Likely POST /api/sendText
            const payload = {
                chatId: `${to}@c.us`, // Standard WA format: 628123...@c.us
                text: message,
                session: sessionName
            };

            // If we have a real server, un-comment this
            // const res = await fetch(`${wahaUrl}/api/sendText`, {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(payload)
            // });
            // return res.ok;

            console.log(`[WhatsappService] MOCK SEND to ${wahaUrl}:`, payload);
            return true;

        } catch (err) {
            console.error('[WhatsappService] Failed to send message:', err);
            return false;
        }
    }
}

export const whatsappService = new WhatsappService();
