'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useParams, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: Date;
}

export default function ChatWidgetPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const tenantId = params.tenantId as string;
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: 'Halo! Ada yang bisa saya bantu hari ini?',
            createdAt: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [tenantName, setTenantName] = useState('Assistant');
    const scrollRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    // Color theme from URL or default (Unused for now but kept as _ to show intent)
    const _primaryColor = searchParams.get('color') || '2563eb'; // blue-600 default

    useEffect(() => {
        // Fetch Tenant Info (Public)
        const fetchTenant = async () => {
            if (!tenantId) return;
            // Note: RLS must allow public read for 'tenants' table or specific fields
            // For now assuming we can read partial data or using a public view.
            // If RLS blocks, we might need a dedicated API route.
            const { data } = await supabase
                .from('tenants')
                .select('name')
                .eq('id', tenantId)
                .single();

            if (data) {
                setTenantName(data.name);
            }
        };
        fetchTenant();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tenantId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const [sessionId, setSessionId] = useState('');

    useEffect(() => {
        // Init Session ID
        let sid = localStorage.getItem('relate_ai_session_id');
        if (!sid) {
            sid = Math.random().toString(36).substring(2, 15);
            localStorage.setItem('relate_ai_session_id', sid);
        }
        setSessionId(sid);
    }, []);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const userContent = inputValue;
        const newUserMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: userContent,
            createdAt: new Date()
        };

        setMessages(prev => [...prev, newUserMsg]);
        setInputValue('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenantId,
                    sessionId: sessionId || 'temp-session',
                    message: userContent
                })
            });

            if (!res.ok) throw new Error('Network response was not ok');

            const json = await res.json();
            const aiMsgData = json.data.message;

            const botMsg: Message = {
                id: aiMsgData.id,
                role: 'assistant',
                content: aiMsgData.content,
                createdAt: new Date(aiMsgData.created_at)
            };
            setMessages(prev => [...prev, botMsg]);

        } catch (error) {
            console.error("Chat Error:", error);
            const errorMsg: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                content: "Maaf, terjadi gangguan koneksi. Silakan coba lagi.",
                createdAt: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen max-h-screen bg-background border rounded-lg overflow-hidden shadow-xl">
            {/* Header */}
            <div className="bg-primary p-4 flex items-center justify-between text-primary-foreground shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-full">
                        <Bot size={24} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg">{tenantName}</h3>
                        <p className="text-xs text-primary-foreground/80 flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            Online
                        </p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4 bg-gray-50 dark:bg-zinc-900/50">
                <div className="space-y-4">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex w-max max-w-[80%] flex-col gap-2 rounded-lg px-3 py-2 text-sm",
                                msg.role === 'user'
                                    ? "ml-auto bg-primary text-primary-foreground"
                                    : "bg-muted text-foreground"
                            )}
                        >
                            {msg.content}
                            <span className="text-[10px] opacity-70 self-end">
                                {msg.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-2 items-center text-muted-foreground text-xs ml-2">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        </div>
                    )}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t bg-background">
                <form onSubmit={handleSend} className="flex gap-2">
                    <Input
                        placeholder="Ketik pesan..."
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        className="flex-1"
                        autoFocus
                    />
                    <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim()}>
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
                <div className="text-center mt-2">
                    <p className="text-[10px] text-muted-foreground">Powered by RelateAI</p>
                </div>
            </div>
        </div>
    );
}
