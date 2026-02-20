import { NextRequest, NextResponse } from "next/server";
import { billingService } from "@/services/billing-service";

export async function POST(req: NextRequest) {
    try {
        // Moota Webhook Payload
        // Usually sends array of mutations or a single notification
        // We'll assume a simplified payload for this integration: 
        // { amount: 150123, description: "TRANSFER ...", ... }

        const body = await req.json();
        console.log("[Moota Hook] Received:", body);

        // Moota often sends an array of mutations
        const mutations = Array.isArray(body) ? body : [body];

        for (const mut of mutations) {
            // We only care about CREDIT (money in)
            if (mut.type === 'CR' || mut.amount > 0) {
                await billingService.verifyPayment(mut.amount);
            }
        }

        return NextResponse.json({ status: 'ok' });

    } catch (error) {
        console.error("Moota Webhook Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
