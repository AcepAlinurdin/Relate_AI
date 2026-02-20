'use client';

import { useActionState } from 'react';
import { loginUser } from '@/app/actions/auth'; // We'll make sure this action handles the redirect logic
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

const initialState = {
    error: '',
};

import { ChevronLeft } from 'lucide-react';

export default function LoginPage() {
    const [state, formAction, isPending] = useActionState(loginUser, initialState);

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
            <Card className="w-full max-w-md relative">
                <Button variant="ghost" className="absolute left-4 top-4" size="icon" asChild>
                    <Link href="/">
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Kembali</span>
                    </Link>
                </Button>
                <CardHeader className="text-center pt-10">
                    <CardTitle className="text-2xl">Masuk ke Relate AI</CardTitle>
                    <CardDescription>Kelola bisnis dan chat pelanggan Anda</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={formAction} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="nama@perusahaan.com"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                            />
                        </div>
                        {state?.error && (
                            <div className="text-sm text-red-500 text-center bg-red-50 p-2 rounded">
                                {state.error}
                            </div>
                        )}
                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? "Memproses..." : "Masuk"}
                        </Button>
                    </form>

                    <div className="mt-4 text-center text-sm text-muted-foreground">
                        <p>Atau masuk sebagai pelanggan?</p>
                        <Link href="/customer/login" className="font-medium text-primary hover:underline">
                            Login Pelanggan via WhatsApp
                        </Link>
                    </div>
                </CardContent>
                <CardFooter className="justify-center flex-col gap-2">
                    <div className="text-sm">
                        Belum punya akun?{" "}
                        <Link href="/register" className="font-medium text-primary hover:underline">
                            Daftar sekarang
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
