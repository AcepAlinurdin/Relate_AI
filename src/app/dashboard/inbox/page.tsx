"use client";

import { useEffect, useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Search, Send, User, UserPlus, Link as LinkIcon, ThermometerSun, Snowflake, Flame } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTier } from "@/contexts/TierContext";

interface Lead {
    id: string;
    name: string;
    phone: string;
    status: string;
    created_at: string;
    score?: number; // Mock score for Tier 2
}

interface Message {
    id: string;
    content: string;
    sender_type: 'user' | 'ai' | 'lead';
    created_at: string;
}

export default function InboxPage() {
    const { tier } = useTier();
    const isTier1 = tier === 1;

    const [leads, setLeads] = useState<Lead[]>([]);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loadingLeads, setLoadingLeads] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchLeads();
    }, []);

    useEffect(() => {
        if (selectedLead) {
            fetchMessages(selectedLead.id);
        }
    }, [selectedLead]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const fetchLeads = async () => {
        setLoadingLeads(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data: tenant } = await supabase.from('tenants').select('id').eq('user_id', user.id).single();
            if (!tenant) return;

            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .eq('tenant_id', tenant.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Mock score for demo purposes since DB doesn't have it yet
            const leadsWithScore = data?.map(lead => ({
                ...lead,
                score: Math.floor(Math.random() * 100)
            })) || [];

            setLeads(leadsWithScore);
        } catch (error) {
            console.error("Error fetching leads:", error);
        } finally {
            setLoadingLeads(false);
        }
    };

    const fetchMessages = async (leadId: string) => {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('lead_id', leadId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setMessages(data || []);
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedLead) return;

        const optimisitcMsg = {
            id: 'temp-' + Date.now(),
            content: newMessage,
            sender_type: 'user' as const,
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, optimisitcMsg]);
        setNewMessage("");

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data: tenant } = await supabase.from('tenants').select('id').eq('user_id', user.id).single();
            if (!tenant) return;

            const { error } = await supabase.from('messages').insert([{
                tenant_id: tenant.id,
                lead_id: selectedLead.id,
                content: optimisitcMsg.content,
                sender_type: 'user'
            }]);

            if (error) throw error;
            fetchMessages(selectedLead.id);
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const createTestLead = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data: tenant } = await supabase.from('tenants').select('id').eq('user_id', user.id).single();
            if (!tenant) return;

            const names = ["Budi Santoso", "Siti Aminah", "Andi Wijaya", "Rina Marlina"];
            const randomName = names[Math.floor(Math.random() * names.length)];

            const { data, error } = await supabase.from('leads').insert([{
                tenant_id: tenant.id,
                name: randomName,
                phone: "08123456789",
                status: 'new'
            }]).select().single();

            if (error) throw error;

            await supabase.from('messages').insert([{
                tenant_id: tenant.id,
                lead_id: data.id,
                content: "Halo, saya tertarik dengan produk Anda. Ada promo?",
                sender_type: 'lead'
            }]);

            fetchLeads();
            setSelectedLead({
                ...data,
                score: Math.floor(Math.random() * 100) // Mock score
            });
        } catch (error) {
            console.error("Error creating test lead:", error);
        }
    };

    const generatePaymentLink = () => {
        if (isTier1) return;
        const link = `https://pay.relate.ai/ord-${Math.floor(Math.random() * 10000)}`;
        setNewMessage(prev => `${prev} Berikut link pembayarannya: ${link}`);
    };

    const getLeadScoreBadge = (score?: number) => {
        if (score === undefined) return null;

        // PRD Section 19 Logic
        if (score > 70) {
            return (
                <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded text-[10px] font-bold border border-red-100">
                    <Flame className="h-3 w-3" />
                    HOT ({score})
                </div>
            );
        } else if (score >= 30) {
            return (
                <div className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-0.5 rounded text-[10px] font-bold border border-orange-100">
                    <ThermometerSun className="h-3 w-3" />
                    WARM ({score})
                </div>
            );
        } else {
            return (
                <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-100">
                    <Snowflake className="h-3 w-3" />
                    COLD ({score})
                </div>
            );
        }
    };

    return (
        <div className="flex h-[calc(100vh-8rem)] flex-col gap-4 md:flex-row">
            {/* Sidebar List */}
            <div className="w-full md:w-80 flex flex-col gap-4">
                <div className="flex actions justify-between items-center">
                    <h2 className="text-xl font-bold">Inbox</h2>
                    <div className="flex items-center gap-2">
                        {/* Tier Badge */}
                        <Badge variant="outline" className={cn("text-[10px]", isTier1 ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-purple-100 text-purple-700 border-purple-200")}>
                            {isTier1 ? "Chatbot Assistant" : "AI Sales Agent"}
                        </Badge>
                        <Button size="icon" variant="outline" onClick={createTestLead} title="Add Test Lead">
                            <UserPlus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search leads..." className="pl-8" />
                </div>
                <Card className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full">
                        <div className="flex flex-col gap-1 p-2">
                            {leads.length === 0 && !loadingLeads && (
                                <div className="text-center p-4 text-muted-foreground text-sm">
                                    No leads yet. Click + to add test lead.
                                </div>
                            )}
                            {leads.map((lead) => (
                                <button
                                    key={lead.id}
                                    onClick={() => setSelectedLead(lead)}
                                    className={cn(
                                        "flex flex-col items-start gap-1 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent",
                                        selectedLead?.id === lead.id && "bg-accent"
                                    )}
                                >
                                    <div className="flex w-full flex-col gap-1">
                                        <div className="flex items-center justify-between w-full">
                                            <div className="font-semibold">{lead.name || 'Unknown'}</div>
                                            {!isTier1 && getLeadScoreBadge(lead.score)}
                                        </div>
                                        <div className="flex items-center justify-between w-full mt-1">
                                            <div className="text-xs text-muted-foreground h-4 overflow-hidden text-ellipsis w-[120px]">
                                                {lead.phone}
                                            </div>
                                            <span className="text-[10px] text-muted-foreground">
                                                {new Date(lead.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </ScrollArea>
                </Card>
            </div>

            {/* Chat Area */}
            <div className="flex flex-1 flex-col">
                {selectedLead ? (
                    <Card className="flex h-full flex-col overflow-hidden">
                        <CardHeader className="flex flex-row items-center border-b px-6 py-4">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                    <User className="h-4 w-4" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-base">{selectedLead.name}</CardTitle>
                                        {!isTier1 && getLeadScoreBadge(selectedLead.score)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">{selectedLead.phone}</div>
                                </div>
                            </div>
                            <div className="ml-auto flex items-center gap-2">
                                <Badge variant="outline" className="capitalize">{selectedLead.status}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="flex flex-1 flex-col bg-muted/10 p-4 overflow-hidden">
                            <div className="flex-1 overflow-y-auto space-y-4 pr-2" ref={scrollRef}>
                                {/* Auto-follow up indicator for Tier 2 */}
                                {!isTier1 && (selectedLead.score || 0) > 30 && (
                                    <div className="flex justify-center">
                                        <span className="text-[10px] bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full border border-yellow-200">
                                            ⚡ AI Auto-follow up active
                                        </span>
                                    </div>
                                )}

                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={cn(
                                            "flex w-max max-w-[75%] flex-col gap-1 rounded-lg px-3 py-2 text-sm",
                                            msg.sender_type === 'user'
                                                ? "ml-auto bg-primary text-primary-foreground"
                                                : "bg-muted"
                                        )}
                                    >
                                        <p>{msg.content}</p>
                                        <span className={cn(
                                            "text-[10px]",
                                            msg.sender_type === 'user' ? "text-primary-foreground/70" : "text-muted-foreground"
                                        )}>
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <Separator className="my-4" />
                            <form onSubmit={sendMessage} className="flex gap-2 items-center">
                                {/* Generate Payment Link - Tier 2 Only */}
                                {!isTier1 && (
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="outline"
                                        onClick={generatePaymentLink}
                                        title="Generate Payment Link"
                                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                    >
                                        <LinkIcon className="h-4 w-4" />
                                    </Button>
                                )}
                                <Input
                                    placeholder={isTier1 ? "Reply as Assistant..." : "Reply as Sales Agent..."}
                                    className="flex-1"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                />
                                <Button type="submit" size="icon">
                                    <Send className="h-4 w-4" />
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="flex h-full items-center justify-center rounded-lg border border-dashed bg-muted/10 p-8 text-center animate-in fade-in-50">
                        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
                            <h3 className="mt-4 text-lg font-semibold">No Conversation Selected</h3>
                            <p className="mb-4 mt-2 text-sm text-muted-foreground">
                                Select a lead from the sidebar to view the conversation.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
