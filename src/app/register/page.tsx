'use client';

import { useActionState } from 'react';
import { registerOwner } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Link from 'next/link';

const initialState = {
    error: '',
};

export default function RegisterPage() {
    const [state, formAction, isPending] = useActionState(registerOwner, initialState);

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle>Buat Akun Relate AI</CardTitle>
                    <CardDescription>
                        Mulai kelola chat dan penjualan otomatis sekarang.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={formAction} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="company_name">Nama Bisnis</Label>
                            <Input
                                id="company_name"
                                name="company_name"
                                placeholder="Contoh: Toko Berkah Jaya"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Pilih Paket</Label>
                            <RadioGroup defaultValue="1" name="tier" className="grid grid-cols-2 gap-4">
                                <div>
                                    <RadioGroupItem value="1" id="tier1" className="peer sr-only" />
                                    <Label
                                        htmlFor="tier1"
                                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                    >
                                        <span className="font-bold">Tier 1</span>
                                        <span className="text-xs text-muted-foreground">Chatbot Assistant</span>
                                    </Label>
                                </div>
                                <div>
                                    <RadioGroupItem value="2" id="tier2" className="peer sr-only" />
                                    <Label
                                        htmlFor="tier2"
                                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                    >
                                        <span className="font-bold">Tier 2</span>
                                        <span className="text-xs text-muted-foreground">Sales Agent + Payment</span>
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

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
                                minLength={6}
                            />
                        </div>
                        {state?.error && <p className="text-sm text-red-500 font-medium">{state.error}</p>}
                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? 'Membuat Akun...' : 'Daftar Sekarang'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center">
                    <Link href="/login" className="text-sm text-muted-foreground hover:underline">
                        Sudah punya akun? Masuk
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
