"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import Cookies from "js-cookie";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Owner State
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Customer State
    const [phone, setPhone] = useState("");

    const handleOwnerLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            router.push("/dashboard");
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCustomerLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Simulating customer login
        // In a real app, you might verify OTP or check DB
        if (phone.length < 10) {
            setError("Nomor HP tidak valid");
            setLoading(false);
            return;
        }

        // Store customer session essentially
        Cookies.set("relate_customer_phone", phone);

        // Redirect to Customer Portal
        router.push("/customer");
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Selamat Datang di Relate AI</CardTitle>
                    <CardDescription>Silakan masuk untuk melanjutkan</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="owner" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="owner">Owner (Bisnis)</TabsTrigger>
                            <TabsTrigger value="customer">Customer (Pelanggan)</TabsTrigger>
                        </TabsList>

                        {/* OWNER LOGIN */}
                        <TabsContent value="owner">
                            <form onSubmit={handleOwnerLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="nama@perusahaan.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                {error && (
                                    <div className="text-sm text-red-500 text-center bg-red-50 p-2 rounded">
                                        {error}
                                    </div>
                                )}
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? "Memproses..." : "Masuk sebagai Owner"}
                                </Button>
                            </form>
                            <div className="mt-4 text-center text-sm">
                                Belum punya akun?{" "}
                                <Link href="/register" className="font-medium text-primary hover:underline">
                                    Daftar sekarang
                                </Link>
                            </div>
                        </TabsContent>

                        {/* CUSTOMER LOGIN */}
                        <TabsContent value="customer">
                            <form onSubmit={handleCustomerLogin} className="space-y-4">
                                <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground mb-4">
                                    Masuk sebagai pelanggan untuk melihat katalog produk dan status pesanan Anda.
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Nomor WhatsApp</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="Contoh: 08123456789"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        required
                                    />
                                </div>
                                {error && (
                                    <div className="text-sm text-red-500 text-center bg-red-50 p-2 rounded">
                                        {error}
                                    </div>
                                )}
                                <Button type="submit" className="w-full variant-secondary" disabled={loading}>
                                    {loading ? "Memproses..." : "Masuk Toko"}
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
