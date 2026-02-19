"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AI_FIXED_QUESTIONS } from "@/lib/constants";
import { aiConfigService, AIConfig } from "@/services/aiConfig";
import { Loader2, Users, ShoppingCart, DollarSign, Activity, TrendingUp, BarChart3, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTier } from "@/contexts/TierContext";
import { supabase } from "@/lib/supabase";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
    const { tier } = useTier();
    const isTier1 = tier === 1;

    // AI Config State
    const [loadingConfig, setLoadingConfig] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<Omit<AIConfig, 'id'>>({
        question_1: '',
        question_2: '',
        question_3: '',
        question_4: '',
        question_5: '',
        additional_details: ''
    });
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Analytics State
    const [stats, setStats] = useState({
        totalLeads: 0,
        totalOrders: 0,
        paidOrders: 0,
        totalRevenue: 0,
        leadsHot: 0,
        leadsWarm: 0,
        leadsCold: 0
    });
    const [loadingStats, setLoadingStats] = useState(true);

    useEffect(() => {
        loadConfig();
        loadStats();
    }, []);

    const loadStats = async () => {
        setLoadingStats(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data: tenant } = await supabase.from('tenants').select('id').eq('user_id', user.id).single();
            if (!tenant) return;

            // Fetch Leads
            const { count: leadCount, data: leads } = await supabase
                .from('leads')
                .select('*', { count: 'exact' })
                .eq('tenant_id', tenant.id);

            // Fetch Orders
            const { count: orderCount, data: orders } = await supabase
                .from('orders')
                .select('*', { count: 'exact' })
                .eq('tenant_id', tenant.id);

            // Calculate metrics
            const paidOrders = orders?.filter(o => o.status === 'paid') || [];
            const revenue = paidOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);

            // Mock Lead Scoring distribution (since we don't have real scores yet for all)
            // In a real app, you'd aggregate this from the DB
            const hot = Math.floor((leadCount || 0) * 0.2);
            const warm = Math.floor((leadCount || 0) * 0.5);
            const cold = (leadCount || 0) - hot - warm;

            setStats({
                totalLeads: leadCount || 0,
                totalOrders: orderCount || 0,
                paidOrders: paidOrders.length,
                totalRevenue: revenue,
                leadsHot: hot,
                leadsWarm: warm,
                leadsCold: cold
            });

        } catch (error) {
            console.error("Error loading stats:", error);
        } finally {
            setLoadingStats(false);
        }
    };

    const loadConfig = async () => {
        try {
            setLoadingConfig(true);
            const data = await aiConfigService.getConfig();
            if (data) {
                setFormData({
                    question_1: data.question_1 || '',
                    question_2: data.question_2 || '',
                    question_3: data.question_3 || '',
                    question_4: data.question_4 || '',
                    question_5: data.question_5 || '',
                    additional_details: data.additional_details || ''
                });
            }
        } catch (error) {
            console.error("Failed to load AI config:", error);
            setMessage({ type: 'error', text: 'Gagal memuat konfigurasi. Silakan refresh halaman.' });
        } finally {
            setLoadingConfig(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            await aiConfigService.saveConfig(formData);
            setMessage({ type: 'success', text: 'Konfigurasi AI berhasil disimpan!' });
            setTimeout(() => {
                setMessage(null);
            }, 3000);
        } catch (error) {
            console.error("Failed to save AI config:", error);
            setMessage({ type: 'error', text: 'Gagal menyimpan konfigurasi. Coba lagi nanti.' });
        } finally {
            setSaving(false);
        }
    };

    if (loadingConfig && loadingStats) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-muted-foreground">Overview kinerja bisnis & konfigurasi AI Anda.</p>
            </div>

            {/* ANALYTICS SECTION */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalLeads}</div>
                        <p className="text-xs text-muted-foreground">Calon pelanggan dari semua channel</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-x-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Pesanan</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalOrders}</div>
                        <p className="text-xs text-muted-foreground">Semua pesanan masuk</p>
                    </CardContent>
                </Card>

                {/* TIER 2 METRICS */}
                {isTier1 ? (
                    <Card className="bg-muted/50 border-dashed">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                            <Lock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-muted-foreground">Locked</div>
                            <p className="text-xs text-muted-foreground">Upgrade to Tier 2 to view</p>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(stats.totalRevenue)}
                            </div>
                            <p className="text-xs text-muted-foreground">Pendapatan dari pesanan lunas</p>
                        </CardContent>
                    </Card>
                )}

                {isTier1 ? (
                    <Card className="bg-muted/50 border-dashed">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
                            <Lock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-muted-foreground">Locked</div>
                            <p className="text-xs text-muted-foreground">Upgrade to Tier 2 to view</p>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.totalLeads > 0 ? ((stats.paidOrders / stats.totalLeads) * 100).toFixed(1) : 0}%
                            </div>
                            <p className="text-xs text-muted-foreground">Persentase leads yang closing</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* TIER 2 ADVANCED INSIGHTS */}
            {!isTier1 && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle>Sales Overview</CardTitle>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <div className="h-[200px] flex items-center justify-center text-muted-foreground border border-dashed rounded-md bg-muted/20">
                                <BarChart3 className="h-8 w-8 mr-2" />
                                <span>Sales Chart Visualization (Coming Soon)</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="col-span-3">
                        <CardHeader>
                            <CardTitle>Lead Quality</CardTitle>
                            <CardDescription>Based on AI Scoring</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center">
                                    <div className="w-[80px] text-sm font-medium">HOT 🔥</div>
                                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                                        <div className="h-full bg-red-500" style={{ width: `${stats.totalLeads ? (stats.leadsHot / stats.totalLeads) * 100 : 0}%` }} />
                                    </div>
                                    <div className="w-[40px] text-right text-sm text-muted-foreground">{stats.leadsHot}</div>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-[80px] text-sm font-medium">WARM ☀️</div>
                                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                                        <div className="h-full bg-orange-500" style={{ width: `${stats.totalLeads ? (stats.leadsWarm / stats.totalLeads) * 100 : 0}%` }} />
                                    </div>
                                    <div className="w-[40px] text-right text-sm text-muted-foreground">{stats.leadsWarm}</div>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-[80px] text-sm font-medium">COLD ❄️</div>
                                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                                        <div className="h-full bg-blue-500" style={{ width: `${stats.totalLeads ? (stats.leadsCold / stats.totalLeads) * 100 : 0}%` }} />
                                    </div>
                                    <div className="w-[40px] text-right text-sm text-muted-foreground">{stats.leadsCold}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Separator className="my-8" />

            {/* AI CONFIGURATION (EXISTING) */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Profil Bisnis & AI</CardTitle>
                            <CardDescription>
                                Lengkapi informasi di bawah ini agar AI dapat menjawab pertanyaan pelanggan sesuai dengan bisnis Anda.
                            </CardDescription>
                        </div>
                        <Badge variant="outline">AI Training</Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            {AI_FIXED_QUESTIONS.map((q) => (
                                <div key={q.id} className="space-y-2">
                                    <Label htmlFor={q.id}>{q.label}</Label>
                                    <Input
                                        id={q.id}
                                        name={q.id}
                                        placeholder={q.placeholder}
                                        value={formData[q.id as keyof typeof formData] as string}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            ))}

                            <div className="space-y-2">
                                <Label htmlFor="additional_details">Informasi Tambahan (Detail)</Label>
                                <textarea
                                    id="additional_details"
                                    name="additional_details"
                                    className={cn(
                                        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                                        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                                        "min-h-[120px]"
                                    )}
                                    placeholder="Tambahkan detail lain yang penting, misalnya jam operasional, kebijakan retur, atau daftar cabang."
                                    value={formData.additional_details}
                                    onChange={handleChange}
                                />
                                <p className="text-[0.8rem] text-muted-foreground">
                                    Informasi ini akan digunakan untuk melengkapi pengetahuan AI tentang bisnis Anda.
                                </p>
                            </div>
                        </div>

                        {message && (
                            <div className={cn(
                                "p-3 rounded-md text-sm font-medium",
                                message.type === 'success' ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            )}>
                                {message.text}
                            </div>
                        )}

                        <div className="flex justify-end">
                            <Button type="submit" disabled={saving}>
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {saving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
