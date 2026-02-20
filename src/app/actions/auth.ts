'use server';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export async function registerOwner(prevState: any, formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const companyName = formData.get('company_name') as string;
    const tier = parseInt(formData.get('tier') as string);
    const origin = (await headers()).get('origin');

    if (!email || !password || !companyName || !tier) {
        return { error: 'Semua field harus diisi.' };
    }

    const supabase = await createClient();

    // 1. Sign Up User
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${origin}/auth/callback`,
        },
    });

    if (authError) {
        return { error: authError.message };
    }

    if (!authData.user) {
        return { error: 'Gagal membuat akun pengguna.' };
    }

    // 2. Create Tenant
    // We need to ensure we use the *authenticated* user to insert the tenant.
    // The current 'supabase' client might not have updated its session immediately after signUp in this scope.
    if (authData.session) {
        const authenticatedSupabase = await createClient();
        await authenticatedSupabase.auth.setSession(authData.session); // Force session set

        const { error: tenantError } = await authenticatedSupabase
            .from('tenants')
            .insert({
                user_id: authData.user.id,
                company_name: companyName,
                subscription_tier: tier,
            });

        if (tenantError) {
            console.error('Tenant creation failed (Authenticated):', tenantError);
            // Verify if it's an RLS issue or something else
            return { error: `Gagal membuat profil perusahaan: ${tenantError.message}` };
        }
    } else {
        // If no session returned (e.g. email confirmation required, though it shouldn't be), try standard insert
        const { error: tenantError } = await supabase
            .from('tenants')
            .insert({
                user_id: authData.user.id,
                company_name: companyName,
                subscription_tier: tier,
                subscription_status: 'pending_payment'
            });

        if (tenantError) {
            console.error('Tenant creation failed (Standard):', tenantError);
            return { error: 'Gagal membuat profil perusahaan. Cek konfigurasi email.' };
        }
    }

    // 3. Redirect manually
    redirect('/dashboard');
}

export async function loginUser(prevState: any, formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        if (error) {
            console.error("Login Error:", error.message);
            return { error: error.message }; // Return actual error to help debugging (e.g. "Email not confirmed")
        }
    }

    // Check if user is an owner (has a tenant)
    const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .single();

    // Redirect logic
    if (tenant) {
        redirect('/dashboard');
    } else {
        // Future: Redirect to customer portal if we support customer accounts
        // For now, assume only owners login via email/pass
        redirect('/dashboard');
    }
}
