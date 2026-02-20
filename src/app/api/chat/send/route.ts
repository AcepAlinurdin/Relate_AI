import { NextRequest, NextResponse } from "next/server";
import { chatProcessor } from "@/services/chat-processor";
import { rateLimit } from "@/lib/rate-limit";

const limiter = rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 500,
});

export async function POST(req: NextRequest) {
    try {
        // 1. Rate Limit Check (IP based)
        const ip = req.headers.get('x-forwarded-for') || 'anonymous';
        await limiter.check(20, ip); // 20 requests per minute per IP

        const body = await req.json();
        const { tenantId, message, sessionId, _senderType = 'user' } = body;

        console.log(`[Chat API] Received:`, { tenantId, message, sessionId });

        if (!tenantId || !message || !sessionId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 2. Process using Unified Processor
        const result = await chatProcessor.processUserMessage(
            tenantId,
            sessionId,
            message,
            'web' // Source is Web Widget
        );

        return NextResponse.json({
            status: 'success',
            data: {
                message: result.aiMessage
            }
        });

    } catch (error) {
        if (error instanceof Error && error.message === 'Rate limit exceeded') {
            return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
        }
        console.error("[Chat API] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
