import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/server";
import { billingService } from "@/services/billing-service";

export async function POST(req: NextRequest) {
    try {
        const supabase = createAdminClient();

        // Get Current User Tenant
        // Since this is a server-to-server call from client component, we need to extract auth
        // However, standard Next.js auth pattern:

        // 1. Get User from Cookie
        // But createAdminClient doesn't read cookies. 
        // We need a way to identify the user.
        // Let's use the standard createClient for Auth check, then admin for operation.

        const { createClient } = await import("@/utils/supabase/server");
        const authClient = await createClient();
        const { data: { user }, error: authError } = await authClient.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: tenant } = await supabase
            .from('tenants')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

        // Create Invoice for Tier 2
        const invoice = await billingService.createInvoice(tenant.id, 2);

        return NextResponse.json({ invoice });

    } catch (error) {
        console.error("Invoice API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
