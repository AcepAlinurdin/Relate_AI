import { createAdminClient } from "@/utils/supabase/server";

export const TIER_PRICES = {
    1: 99000,  // Basic (Paid)
    2: 199000 // Pro (Complete)
};

export class BillingService {
    private supabase;

    constructor() {
        this.supabase = createAdminClient();
    }

    async createInvoice(tenantId: string, targetTier: number) {
        // 1. Check if already has pending invoice
        const { data: existing } = await this.supabase
            .from('subscription_invoices')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (existing) {
            // Check if expired (e.g. 24 hours). For now, just return existing.
            return existing;
        }

        // 2. Calculate Amount with Unique Code
        const baseAmount = TIER_PRICES[targetTier as keyof typeof TIER_PRICES] || 150000;

        // Simple unique code generation (001 - 999)
        // In high volume, we'd check DB for collisions.
        const uniqueCode = Math.floor(Math.random() * 999) + 1;
        const totalAmount = baseAmount + uniqueCode;

        // 3. Create Invoice
        const { data: newInvoice, error } = await this.supabase
            .from('subscription_invoices')
            .insert({
                tenant_id: tenantId,
                target_tier: targetTier,
                amount: totalAmount,
                unique_code: uniqueCode,
                status: 'pending',
                payment_method: 'bank_transfer'
            })
            .select('*')
            .single();

        if (error) throw error;
        return newInvoice;
    }

    async verifyPayment(amount: number) {
        // Called by Moota Webhook
        console.log(`[BillingService] Verifying payment for amount: ${amount}`);

        // Find pending invoice with exact amount
        const { data: invoice } = await this.supabase
            .from('subscription_invoices')
            .select('*')
            .eq('amount', amount)
            .eq('status', 'pending')
            .maybeSingle(); // Assumes amount is unique enough for pending window

        if (!invoice) {
            console.log('[BillingService] No pending invoice found for this amount.');
            return null;
        }

        // Update Invoice Status
        await this.supabase
            .from('subscription_invoices')
            .update({ status: 'paid' })
            .eq('id', invoice.id);

        // Calculate new end date (30 days from now)
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);

        // Update Tenant Tier & Status
        await this.supabase
            .from('tenants')
            .update({
                subscription_tier: invoice.target_tier,
                subscription_status: 'active',
                subscription_end_date: endDate.toISOString()
            })
            .eq('id', invoice.tenant_id);

        return invoice;
    }
}

export const billingService = new BillingService();
