"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Lock, CreditCard } from "lucide-react";
import { useTier } from "@/contexts/TierContext";

export default function SettingsPage() {
    const { tier } = useTier();
    const isTier1 = tier === 1;

    const [channels, setChannels] = useState({
        waha: false,
        telegram: false,
    });

    const [payment, setPayment] = useState({
        gateway: "moota",
        bankName: "BCA",
        accountNumber: "",
    });

    const handleChannelToggle = (channel: keyof typeof channels) => {
        setChannels(prev => ({
            ...prev,
            [channel]: !prev[channel]
        }));
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Pengaturan</h2>
                <p className="text-muted-foreground">Manage your account settings and preferences.</p>
            </div>

            <Tabs defaultValue="channels" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="channels">Saluran (Channels)</TabsTrigger>
                    <TabsTrigger value="payment">Pembayaran (Payment)</TabsTrigger>
                </TabsList>

                {/* CHANNELS TAB */}
                <TabsContent value="channels" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Connected Channels</CardTitle>
                            <CardDescription>
                                Manage the communication channels connected to your Omnichannel Inbox.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* WAHA (WhatsApp) */}
                            <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
                                <div className="flex items-center space-x-4">
                                    <div className="p-2 bg-green-100 rounded-full">
                                        <MessageSquare className="h-6 w-6 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium leading-none">WAHA (WhatsApp)</p>
                                        <p className="text-sm text-muted-foreground">Connect your WhatsApp via WAHA API.</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    {channels.waha && <Badge variant="default" className="bg-green-600">Connected</Badge>}
                                    <Switch
                                        checked={channels.waha}
                                        onCheckedChange={() => handleChannelToggle('waha')}
                                    />
                                </div>
                            </div>
                            {channels.waha && (
                                <div className="pl-4 border-l-2 ml-6 space-y-2">
                                    <div className="grid w-full max-w-sm items-center gap-1.5">
                                        <Label htmlFor="waha-url">WAHA API URL</Label>
                                        <Input type="text" id="waha-url" placeholder="http://localhost:3000" />
                                    </div>
                                </div>
                            )}

                            {/* Telegram */}
                            <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
                                <div className="flex items-center space-x-4">
                                    <div className="p-2 bg-blue-100 rounded-full">
                                        <Send className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium leading-none">Telegram Bot</p>
                                        <p className="text-sm text-muted-foreground">Connect your Telegram Bot.</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    {channels.telegram && <Badge variant="default" className="bg-green-600">Connected</Badge>}
                                    <Switch
                                        checked={channels.telegram}
                                        onCheckedChange={() => handleChannelToggle('telegram')}
                                    />
                                </div>
                            </div>
                            {channels.telegram && (
                                <div className="pl-4 border-l-2 ml-6 space-y-2">
                                    <div className="grid w-full max-w-sm items-center gap-1.5">
                                        <Label htmlFor="telegram-token">Bot Token</Label>
                                        <Input type="password" id="telegram-token" placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11" />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* PAYMENT TAB */}
                <TabsContent value="payment" className="space-y-4">
                    {isTier1 ? (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Lock className="h-5 w-5 text-muted-foreground" />
                                    Payment Configuration
                                </CardTitle>
                                <CardDescription>
                                    This feature is locked on Tier 1 (Chatbot Assistant).
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                                    <div className="p-4 bg-muted rounded-full">
                                        <CreditCard className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <div className="max-w-md space-y-2">
                                        <h3 className="font-semibold text-lg">Upgrade to Sales Agent</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Tier 2 allows you to accept payments via Moota, generate payment links, and track revenue automatically.
                                        </p>
                                    </div>
                                    <Button variant="default">Upgrade to Tier 2</Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardHeader>
                                <CardTitle>Payment Configuration</CardTitle>
                                <CardDescription>
                                    Set up your payment integration (Powered by Moota).
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="gateway">Payment Provider</Label>
                                    <Input disabled value="Moota (Mutasi Bank Automation)" />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="bankName">Nama Bank</Label>
                                    <select
                                        id="bankName"
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={payment.bankName}
                                        onChange={(e) => setPayment({ ...payment, bankName: e.target.value })}
                                    >
                                        <option value="BCA">BCA</option>
                                        <option value="MANDIRI">Mandiri</option>
                                        <option value="BNI">BNI</option>
                                        <option value="BRI">BRI</option>
                                    </select>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="accountNumber">Nomor Rekening</Label>
                                    <Input
                                        id="accountNumber"
                                        type="text"
                                        placeholder="Contoh: 1234567890"
                                        value={payment.accountNumber}
                                        onChange={(e) => setPayment({ ...payment, accountNumber: e.target.value })}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Masukkan nomor rekening bank Anda yang terdaftar di Moota.
                                    </p>
                                </div>

                                <Button className="w-full sm:w-auto">Save Configuration</Button>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
