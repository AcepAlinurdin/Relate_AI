
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // 1. Get Tenant ID
        const { data: tenant } = await supabase
            .from('tenants')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (!tenant) {
            return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
        }

        // 2. Find pending invoice
        const { data: invoice } = await supabase
            .from('subscription_invoices')
            .select('*')
            .eq('tenant_id', tenant.id)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (!invoice) {
            return NextResponse.json({ invoice: null });
        }

        return NextResponse.json({ invoice });

    } catch (error) {
        console.error("Error fetching pending invoice:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
