import { createAdminClient } from "@/utils/supabase/server";
import { aiService } from "@/services/ai-service";

export interface ProcessResult {
    userMessage: any;
    aiMessage: any;
    lead: any;
    conversation: any;
}

export class ChatProcessor {
    private supabase;

    constructor() {
        this.supabase = createAdminClient();
    }

    async processUserMessage(
        tenantId: string,
        sessionId: string, // Phone number (WA) or Session ID (Web)
        messageContent: string,
        channelSource: 'web' | 'wa_official' | 'wa_waha' | 'telegram',
        senderName?: string
    ): Promise<ProcessResult> {

        console.log(`[ChatProcessor] Processing: ${channelSource} from ${sessionId}`);

        // 1. Manage Lead (Upsert)
        let { data: lead } = await this.supabase
            .from('leads')
            .select('id')
            .eq('tenant_id', tenantId)
            .eq('social_id', sessionId)
            .eq('channel_source', channelSource)
            .maybeSingle();

        if (!lead) {
            const { data: newLead, error: createLeadError } = await this.supabase
                .from('leads')
                .insert({
                    tenant_id: tenantId,
                    name: senderName || `Visitor-${sessionId.slice(0, 6)}`,
                    channel_source: channelSource,
                    social_id: sessionId,
                    status: 'new'
                })
                .select('id')
                .single();

            if (createLeadError) throw createLeadError;
            lead = newLead;
        }

        // 2. Manage Conversation (Find Open or Create)
        // TODO: Handle channel_id linking if we have multiple channels per tenant
        let { data: conversation } = await this.supabase
            .from('conversations')
            .select('id')
            .eq('lead_id', lead.id)
            .eq('status', 'open')
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (!conversation) {
            const { data: newConv, error: createConvError } = await this.supabase
                .from('conversations')
                .insert({
                    tenant_id: tenantId,
                    lead_id: lead.id,
                    status: 'open',
                    channel_id: null
                })
                .select('id')
                .single();

            if (createConvError) throw createConvError;
            conversation = newConv;
        }

        // 3. Save User Message
        const { data: userMsg, error: msgError } = await this.supabase
            .from('messages')
            .insert({
                tenant_id: tenantId,
                conversation_id: conversation.id,
                content: messageContent,
                sender_type: 'user'
            })
            .select('*')
            .single();

        if (msgError) throw msgError;

        // 4. Generate AI Response
        // We pass the conversation context if needed (not implemented in MVP AI Service yet)
        const aiResponse = await aiService.generateResponse(tenantId, messageContent);

        // 5. Save AI Message
        const { data: aiMsg, error: aiMsgError } = await this.supabase
            .from('messages')
            .insert({
                tenant_id: tenantId,
                conversation_id: conversation.id,
                content: aiResponse,
                sender_type: 'ai'
            })
            .select('*')
            .single();

        if (aiMsgError) throw aiMsgError;

        return {
            userMessage: userMsg,
            aiMessage: aiMsg,
            lead,
            conversation
        };
    }
}

export const chatProcessor = new ChatProcessor();
