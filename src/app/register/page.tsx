'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

function RegisterForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const planParam = searchParams.get('plan');
    const [plan, setPlan] = useState<number | null>(null);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (planParam) {
            const p = parseInt(planParam);
            if (p === 1 || p === 2) {
                setPlan(p);
            }
        }
    }, [planParam]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (!plan) {
                throw new Error('Please select a plan from the pricing page first.');
            }

            // 1. Sign Up User
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error('Registration failed.');

            // 2. Create Tenant
            const { error: tenantError } = await supabase
                .from('tenants')
                .insert({
                    user_id: authData.user.id,
                    company_name: companyName,
                    subscription_tier: plan,
                });

            if (tenantError) {
                // Rollback? Ideally use a DB function/trigger for atomicity
                console.error('Tenant creation failed:', tenantError);
                throw new Error('Failed to create company profile.');
            }

            // 3. Redirect
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>Create an Account</CardTitle>
                <CardDescription>
                    {plan ? `Registering for ${plan === 1 ? 'Job Hunter Assistant (Tier 1)' : 'AI Sales Agent (Tier 2)'}` : 'Select a plan to continue'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="company">Company Name</Label>
                        <Input
                            id="company"
                            placeholder="Acme Inc."
                            required
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="m@example.com"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="justify-center">
                <Link href="/login" className="text-sm text-muted-foreground hover:underline">
                    Already have an account? Login
                </Link>
            </CardFooter>
        </Card>
    );
}

export default function RegisterPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
            <Suspense fallback={<div>Loading form...</div>}>
                <RegisterForm />
            </Suspense>
        </div>
    );
}
