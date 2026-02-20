"use client";

import { useState, useEffect, useActionState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { MessageSquare, Send, Lock, CreditCard, Code, Copy, Check, Save, Loader2 } from "lucide-react";
import { useTier } from "@/contexts/TierContext";
import { supabase } from "@/lib/supabase";
import { updateTenantSettings } from "@/app/actions/settings";

export default function SettingsPage() {
    const { tier, status } = useTier();
    const isTier1 = tier === 1;
    const isLocked = status === 'expired' || status === 'pending_payment';

    const [tenantId, setTenantId] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [loadingData, setLoadingData] = useState(true);

    // Form State
    const [state, formAction, isPending] = useActionState(updateTenantSettings, null);

    // Local state for inputs (to handle controlled inputs)
    const [formData, setFormData] = useState({
        waha_url: "",
        telegram_bot_token: "",
        bank_name: "BCA",
        bank_account_number: "",
        bank_account_holder: ""
    });

    const [channels, setChannels] = useState({
        waha: false,
        telegram: false,
    });

    useEffect(() => {
        const fetchTenant = async () => {
            setLoadingData(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data, error } = await supabase
                        .from('tenants')
                        .select('id, waha_url, telegram_bot_token, bank_name, bank_account_number, bank_account_holder')
                        .eq('user_id', user.id)
                        .single();

                    if (error) {
                        console.error("Error fetching tenant:", error);
                    } else if (data) {
                        setTenantId(data.id);
                        setFormData({
                            waha_url: data.waha_url || "",
                            telegram_bot_token: data.telegram_bot_token || "",
                            bank_name: data.bank_name || "BCA",
                            bank_account_number: data.bank_account_number || "",
                            bank_account_holder: data.bank_account_holder || ""
                        });

                        // Auto-enable switch if data exists
                        setChannels({
                            waha: !!data.waha_url,
                            telegram: !!data.telegram_bot_token
                        });
                    }
                }
            } catch (err) {
                console.error("Unexpected error fetching tenant:", err);
            } finally {
                setLoadingData(false);
            }
        };
        fetchTenant();
    }, []);

    // Show toast on success
    useEffect(() => {
        if (state?.success) {
            // alert('Settings updated!'); 
            // In a real app use toast
        }
    }, [state]);

    const handleChannelToggle = (channel: keyof typeof channels) => {
        setChannels(prev => ({
            ...prev,
            [channel]: !prev[channel]
        }));
    };

    const copyToClipboard = () => {
        if (!tenantId) return;
        const code = `<script src="${window.location.origin}/widget.js" data-tenant-id="${tenantId}"></script>`;
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loadingData) {
        return <div className="p-8 text-center">Loading settings...</div>;
    }

    return (
        <div className="space-y-6 relative">
            {isLocked && (
                <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg border">
                    <div className="text-center space-y-4 p-6 bg-card rounded-lg border shadow-lg max-w-md mx-4">
                        <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-full w-fit mx-auto">
                            <Lock className="h-8 w-8 text-yellow-600 dark:text-yellow-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">Akses Pengaturan Terkunci</h3>
                            <p className="text-muted-foreground text-sm mt-2">
                                {status === 'expired'
                                    ? 'Masa berlangganan Anda telah habis. Harap perbarui langganan untuk mengubah pengaturan.'
                                    : 'Menunggu pembayaran. Harap selesaikan pembayaran untuk mengaktifkan fitur pengaturan.'}
                            </p>
                        </div>
                        <Button onClick={() => window.location.href = '/dashboard/billing'}>
                            Ke Halaman Tagihan
                        </Button>
                    </div>
                </div>
            )}

            <div>
                <h2 className="text-3xl font-bold tracking-tight">Pengaturan</h2>
                <p className="text-muted-foreground">Manage your account settings and preferences.</p>
            </div>

            <form action={formAction} className={isLocked ? 'pointer-events-none opacity-50' : ''}>
                <Tabs defaultValue="integration" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="integration">Integrasi Widget</TabsTrigger>
                        <TabsTrigger value="channels">Saluran (Channels)</TabsTrigger>
                        <TabsTrigger value="payment">Pembayaran (Payment)</TabsTrigger>
                    </TabsList>

                    {/* INTEGRATION TAB */}
                    <TabsContent value="integration" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Code className="h-5 w-5" />
                                    Pasang Chat Widget
                                </CardTitle>
                                <CardDescription>
                                    Copy kode di bawah ini dan paste di bagian <code>&lt;body&gt;</code> website Anda.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="relative rounded-md bg-muted p-4 font-mono text-sm break-all pr-12">
                                    {`<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/widget.js" data-tenant-id="${tenantId}"></script>`}

                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="absolute right-2 top-2"
                                        type="button"
                                        onClick={copyToClipboard}
                                        disabled={isLocked}
                                    >
                                        {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>
                                <div className="rounded-lg border p-4 bg-blue-50 dark:bg-blue-900/10 text-sm text-blue-800 dark:text-blue-300">
                                    <p className="font-semibold mb-1">Cara Tes:</p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>Copy kode di atas & paste ke file HTML lokal.</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* CHANNELS TAB */}
                    <TabsContent value="channels" className="space-y-4">
                        {isTier1 ? (
                            <Card className="border-muted bg-muted/40">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-muted-foreground">
                                        <Lock className="h-5 w-5" />
                                        Saluran Terkunci
                                    </CardTitle>
                                    <CardDescription>
                                        Fitur Custom Channel (WhatsApp/Telegram) hanya tersedia untuk paket <strong>Sales Agent (Tier 2)</strong>.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                                        <div className="p-4 bg-background rounded-full border">
                                            <MessageSquare className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                        <div className="max-w-md space-y-2">
                                            <h3 className="font-semibold text-lg">Hubungkan WhatsApp & Telegram</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Upgrade ke Tier 2 untuk menghubungkan berbagai saluran komunikasi dalam satu inbox.
                                            </p>
                                        </div>
                                        <Button variant="default" type="button" onClick={() => window.location.href = '/dashboard/billing'} disabled={isLocked}>
                                            Upgrade Sekarang
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Connected Channels</CardTitle>
                                    <CardDescription>
                                        Atur koneksi WhatsApp dan Telegram Anda.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* WAHA (WhatsApp) */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
                                            <div className="flex items-center space-x-4">
                                                <div className="p-2 bg-green-100 rounded-full">
                                                    <MessageSquare className="h-6 w-6 text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium leading-none">WAHA (WhatsApp)</p>
                                                    <p className="text-sm text-muted-foreground">Hubungkan WhatsApp via WAHA API.</p>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={channels.waha}
                                                onCheckedChange={() => handleChannelToggle('waha')}
                                                disabled={isLocked}
                                            />
                                        </div>
                                        {channels.waha && (
                                            <div className="pl-4 border-l-2 ml-6 space-y-2 animate-in fade-in slide-in-from-top-2">
                                                <div className="grid w-full max-w-lg items-center gap-1.5">
                                                    <Label htmlFor="waha_url">WAHA API URL</Label>
                                                    <Input
                                                        id="waha_url"
                                                        name="waha_url"
                                                        placeholder="https://your-waha-instance.com"
                                                        value={formData.waha_url}
                                                        onChange={(e) => setFormData({ ...formData, waha_url: e.target.value })}
                                                        disabled={isLocked}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Telegram */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
                                            <div className="flex items-center space-x-4">
                                                <div className="p-2 bg-blue-100 rounded-full">
                                                    <Send className="h-6 w-6 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium leading-none">Telegram Bot</p>
                                                    <p className="text-sm text-muted-foreground">Hubungkan Bot Telegram Anda.</p>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={channels.telegram}
                                                onCheckedChange={() => handleChannelToggle('telegram')}
                                                disabled={isLocked}
                                            />
                                        </div>
                                        {channels.telegram && (
                                            <div className="pl-4 border-l-2 ml-6 space-y-2 animate-in fade-in slide-in-from-top-2">
                                                <div className="grid w-full max-w-lg items-center gap-1.5">
                                                    <Label htmlFor="telegram_bot_token">Bot Token</Label>
                                                    <Input
                                                        id="telegram_bot_token"
                                                        name="telegram_bot_token"
                                                        type="password"
                                                        placeholder="123456:ABC-DEF..."
                                                        value={formData.telegram_bot_token}
                                                        onChange={(e) => setFormData({ ...formData, telegram_bot_token: e.target.value })}
                                                        disabled={isLocked}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* PAYMENT TAB */}
                    <TabsContent value="payment" className="space-y-4">
                        {isTier1 ? (
                            <Card className="border-muted bg-muted/40">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-muted-foreground">
                                        <Lock className="h-5 w-5" />
                                        Konfigurasi Pembayaran Terkunci
                                    </CardTitle>
                                    <CardDescription>
                                        Fitur ini hanya tersedia untuk paket <strong>Sales Agent (Tier 2)</strong>.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                                        <div className="p-4 bg-background rounded-full border">
                                            <CreditCard className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                        <div className="max-w-md space-y-2">
                                            <h3 className="font-semibold text-lg">Mulai Terima Pembayaran Otomatis</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Upgrade ke Tier 2 untuk menghubungkan rekening bank Anda dengan Moota dan memproses order otomatis.
                                            </p>
                                        </div>
                                        <Button variant="default" type="button" onClick={() => window.location.href = '/dashboard/billing'} disabled={isLocked}>
                                            Upgrade Sekarang
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Konfigurasi Pembayaran (Moota)</CardTitle>
                                    <CardDescription>
                                        Masukkan rekening bank penerima untuk verifikasi pembayaran otomatis.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="gateway">Payment Provider</Label>
                                        <Input disabled value="Moota (Mutasi Bank Automation)" />
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="bank_name">Nama Bank</Label>
                                            <select
                                                id="bank_name"
                                                name="bank_name"
                                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
                                                value={formData.bank_name}
                                                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                                                disabled={isLocked}
                                            >
                                                <option value="BCA">BCA</option>
                                                <option value="MANDIRI">Mandiri</option>
                                                <option value="BNI">BNI</option>
                                                <option value="BRI">BRI</option>
                                            </select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="bank_account_holder">Atas Nama</Label>
                                            <Input
                                                id="bank_account_holder"
                                                name="bank_account_holder"
                                                placeholder="Contoh: PT. Relate AI"
                                                value={formData.bank_account_holder}
                                                onChange={(e) => setFormData({ ...formData, bank_account_holder: e.target.value })}
                                                disabled={isLocked}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="bank_account_number">Nomor Rekening</Label>
                                        <Input
                                            id="bank_account_number"
                                            name="bank_account_number"
                                            placeholder="Contoh: 1234567890"
                                            value={formData.bank_account_number}
                                            onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                                            disabled={isLocked}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Pastikan nomor rekening ini sudah terdaftar di akun Moota Anda.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>

                {/* Save Button Footer - ONLY SHOW FOR TIER 2 or if Tier 1 has editable settings (which they don't now) */}
                {!isTier1 && (
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t flex justify-end gap-2 md:static md:bg-transparent md:border-0 md:p-0 md:mt-6">
                        {state?.success && (
                            <div className="text-green-600 flex items-center gap-2 mr-4 text-sm font-medium animate-in fade-in">
                                <Check className="h-4 w-4" /> Tersimpan!
                            </div>
                        )}
                        {state?.error && (
                            <div className="text-red-600 flex items-center gap-2 mr-4 text-sm font-medium animate-in fade-in">
                                Error: {state.error}
                            </div>
                        )}
                        <Button type="submit" disabled={isPending || isLocked}>
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" /> Save Configuration
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </form>
        </div>
    );
}
