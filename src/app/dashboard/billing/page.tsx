"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, CreditCard, AlertCircle, X } from "lucide-react";
import { useTier } from "@/contexts/TierContext";
import { useRouter } from "next/navigation";

// Sub-component for pricing card
function PlanCard({ title, price, features, current, onUpgrade, loading, customButtonText }: any) {
    return (
        <Card className={`flex flex-col ${current ? 'border-primary shadow-md' : ''}`}>
            <CardHeader>
                <div className="flex justify-between items-center mb-2">
                    <CardTitle>{title}</CardTitle>
                    {current && <Badge>Active Plan</Badge>}
                </div>
                <CardDescription>
                    <span className="text-3xl font-bold text-foreground">{price}</span>
                    {price !== 'Free' && <span className="text-muted-foreground">/bulan</span>}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
                <ul className="space-y-2 text-sm">
                    {features.map((f: string, i: number) => {
                        const isNegative = f.toLowerCase().startsWith('tidak ');
                        return (
                            <li key={i} className={`flex items-center ${isNegative ? 'text-muted-foreground' : ''}`}>
                                {isNegative ? (
                                    <X className="mr-2 h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <Check className="mr-2 h-4 w-4 text-green-500" />
                                )}
                                {f}
                            </li>
                        );
                    })}
                </ul>
            </CardContent>
            <CardFooter>
                {current ? (
                    <Button disabled className="w-full">Current Plan</Button>
                ) : (
                    <Button
                        className="w-full"
                        variant={price === 'Free' ? "outline" : "default"}
                        onClick={onUpgrade}
                        disabled={loading}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {customButtonText || (price === 'Free' ? "Downgrade" : "Upgrade Now")}
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}

export default function BillingPage() {
    const { tier, status, refreshTier } = useTier(); // Get status from context
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [invoice, setInvoice] = useState<any>(null); // To show Payment Instructions

    // Auto-fetch invoice if pending payment and no invoice shown yet
    useEffect(() => {
        const fetchPendingInvoice = async () => {
            if (status === 'pending_payment' && !invoice) {
                setLoading(true);
                try {
                    const res = await fetch('/api/billing/get-pending-invoice');
                    const json = await res.json();
                    if (json.invoice) {
                        setInvoice(json.invoice);
                    }
                } catch (error) {
                    console.error("Failed to fetch pending invoice", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchPendingInvoice();
    }, [status, invoice]);

    const handleUpgrade = async (targetTier: number) => {
        setLoading(true);
        try {
            // Call API to create invoice
            const res = await fetch('/api/billing/create-invoice', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ targetTier }),
            });
            const json = await res.json();

            if (json.invoice) {
                setInvoice(json.invoice);
            }
        } catch (error) {
            console.error("Upgrade failed", error);
        } finally {
            setLoading(false);
        }
    };

    if (invoice) {
        return (
            <div className="max-w-2xl mx-auto py-10 space-y-6">
                <h2 className="text-3xl font-bold">Instruksi Pembayaran</h2>
                <Card className="border-green-500 bg-green-50 dark:bg-green-900/10">
                    <CardHeader>
                        <CardTitle className="text-green-700 dark:text-green-400 flex items-center gap-2">
                            <CreditCard className="h-6 w-6" />
                            Silakan Transfer untuk Aktivasi
                        </CardTitle>
                        <CardDescription>
                            Selesaikan pembayaran Anda untuk mengaktifkan paket {invoice.target_tier === 1 ? 'Starter' : 'Complete'}.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="text-muted-foreground">Bank Tujuan:</div>
                            <div className="font-bold">BCA (Bank Central Asia)</div>

                            <div className="text-muted-foreground">Nomor Rekening:</div>
                            <div className="font-bold text-lg">123 456 7890</div>

                            <div className="text-muted-foreground">Atas Nama:</div>
                            <div className="font-bold">Relate AI (PT. Teknologi)</div>

                            <div className="text-muted-foreground">Total Transfer:</div>
                            <div className="font-bold text-2xl text-blue-600">
                                Rp {new Intl.NumberFormat('id-ID').format(invoice.amount)}
                            </div>
                        </div>

                        <div className="flex p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 rounded-lg items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                            <div className="text-sm text-yellow-800 dark:text-yellow-200">
                                <p className="font-bold">PENTING:</p>
                                <p>Mohon transfer <strong>TEPAT</strong> sampai 3 digit terakhir (Rp {invoice.amount}).</p>
                                <p>Sistem akan memverifikasi otomatis dalam 1-5 menit setelah transfer.</p>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button variant="ghost" onClick={() => setInvoice(null)}>Kembali</Button>
                        <Button onClick={() => { setInvoice(null); refreshTier(); }}>
                            Saya Sudah Transfer
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    const isPending = status === 'pending_payment';
    const isExpired = status === 'expired';
    const isLocked = isPending || isExpired;

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">
                    {isLocked ? (isExpired ? 'Perpanjang Langganan' : 'Aktivasi Paket Langganan') : 'Paket & Langganan'}
                </h2>
                <p className="text-muted-foreground">
                    {isLocked
                        ? (isExpired
                            ? 'Masa aktif paket Anda telah habis. Silakan perpanjang untuk melanjutkan.'
                            : 'Selesaikan pembayaran untuk mulai menggunakan Relate AI.')
                        : 'Pilih paket yang sesuai dengan kebutuhan bisnis Anda.'}
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2 max-w-4xl">
                <PlanCard
                    title="Core (Tier 1)"
                    price="Rp 99.000"
                    current={tier === 1 && !isLocked}
                    onUpgrade={handleUpgrade}
                    loading={loading}
                    targetTier={1}
                    customButtonText={isLocked && tier === 1 ? "Bayar & Aktifkan Kembali" : undefined}
                    features={[
                        "Omnichannel inbox",
                        "AI auto reply produk & FAQ",
                        "Natural conversation",
                        "Lead classification basic",
                        "Simpan data customer",
                        "Tidak jualan aktif",
                        "Tidak follow-up otomatis",
                        "Tidak payment"
                    ]}
                />

                <PlanCard
                    title="Sales Agent + Payment (Tier 2)"
                    price="Rp 199.000"
                    current={tier === 2 && !isLocked}
                    onUpgrade={handleUpgrade}
                    loading={loading}
                    targetTier={2}
                    customButtonText={isLocked && tier === 2 ? "Bayar & Aktifkan Kembali" : undefined}
                    features={[
                        "Omnichannel inbox",
                        "AI auto reply produk & FAQ",
                        "Natural conversation",
                        "Lead classification basic",
                        "Simpan data customer",
                        "AI aktif jualan (closing)",
                        "Auto follow-up buyer",
                        "Lead scoring pintar",
                        "Generate payment link otomatis",
                        "Payment langsung di chat",
                        "Status order real time",
                        "Conversion analytics"
                    ]}
                />
            </div>

            <div className="p-4 rounded-lg bg-muted text-sm text-muted-foreground text-center max-w-4xl">
                Moota Integration is handled automatically. Once you upgrade, you can configure automatic payment mutations.
            </div>
        </div>
    );
}
