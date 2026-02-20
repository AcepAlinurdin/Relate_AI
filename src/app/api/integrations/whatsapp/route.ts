import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { chatProcessor } from "@/services/chat-processor";
import { whatsappService } from "@/services/whatsapp-service";
import { createAdminClient } from "@/utils/supabase/server";

// Initialize rate limiter
// 60 requests per 10 seconds per IP (Webhooks can be bursty)
const limiter = rateLimit({
    interval: 10 * 1000,
    uniqueTokenPerInterval: 500,
});

export async function POST(req: NextRequest) {
    try {
        await limiter.check(60, "webhook");

        const body = await req.json();
        console.log('[WA Hook] Received:', JSON.stringify(body, null, 2));

        // WAHA Payload Structure (Simplified Check)
        // Usually: { payload: { from: '...', body: '...' }, session: '...' }
        // Or direct: { from: '...', body: '...' } depending on event

        // This is a simplified handler assuming 'message' event structure
        const messageData = body.payload || body;

        // Ensure it's a message
        if (!messageData.from || !messageData.body) {
            // Ignore events that are not messages (e.g. status updates)
            return NextResponse.json({ status: 'ignored' });
        }

        // Remove @c.us suffix
        const fromNumber = messageData.from.replace('@c.us', '');
        const messageBody = messageData.body;
        const pushName = messageData._data?.notifyName || 'Unknown WA User';

        // ISSUE: Determining Tenant ID
        // Webhook usually doesn't tell us which tenant this session belongs to unless we map it.
        // Option 1: We configured the webhook URL with a query param ?tenantId=...
        // Option 2: We look up the 'session' name in our `channels` table.

        let tenantId = req.nextUrl.searchParams.get('tenantId');

        if (!tenantId) {
            // Fallback: Try to find tenant by WAHA session name if sent
            const sessionName = body.session;
            if (sessionName) {
                const supabase = createAdminClient();
                const { data: channel } = await supabase
                    .from('channels')
                    .select('tenant_id')
                    .eq('config->>session_name', sessionName)
                    .single();

                if (channel) tenantId = channel.tenant_id;
            }
        }

        if (!tenantId) {
            console.error('[WA Hook] Tenant ID not found for incoming message.');
            return NextResponse.json({ error: 'Tenant not identified' }, { status: 400 });
        }

        // Process Message
        const result = await chatProcessor.processUserMessage(
            tenantId,
            fromNumber,
            messageBody,
            'wa_waha',
            pushName
        );

        // Send AI Reply back to WA
        if (result.aiMessage) {
            await whatsappService.sendMessage(tenantId, fromNumber, result.aiMessage.content);
        }

        return NextResponse.json({ status: 'success' });

    } catch (error) {
        if (error instanceof Error && error.message === 'Rate limit exceeded') {
            return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
        }

        console.error("Webhook processing error:", error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    return NextResponse.json({ status: 'ready', message: 'WAHA Webhook Endpoint' });
}
