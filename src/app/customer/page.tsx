"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, LogOut, Package, MessageCircle, X, Send, CreditCard, CheckCircle2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Product {
    id: string;
    name: string;
    price: number;
    stock: number;
    description: string;
    tenant_id: string;
}

interface Message {
    id: string;
    content: string;
    sender_type: 'user' | 'ai' | 'lead';
    created_at: string;
}

export default function CustomerDashboard() {
    const router = useRouter();
    const [phone, setPhone] = useState<string | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<{ [key: string]: number }>({});
    const [loading, setLoading] = useState(true);
    const [tenantId, setTenantId] = useState<string | null>(null);

    // Chat State
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [leadId, setLeadId] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Payment State
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [paymentStep, setPaymentStep] = useState<'review' | 'paying' | 'success'>('review');

    useEffect(() => {
        const storedPhone = Cookies.get("relate_customer_phone");
        if (!storedPhone) {
            router.push("/login");
            return;
        }
        setPhone(storedPhone);
        fetchProducts();
    }, [router]);

    useEffect(() => {
        if (isChatOpen && phone && tenantId) {
            initializeChat();
        }
    }, [isChatOpen, phone, tenantId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const fetchProducts = async () => {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .limit(20);

            if (error) throw error;
            setProducts(data || []);

            // Assume the first product's tenant is the current shop for this prototype
            if (data && data.length > 0) {
                setTenantId(data[0].tenant_id);
            }
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        Cookies.remove("relate_customer_phone");
        router.push("/login");
    };

    const addToCart = (productId: string) => {
        setCart(prev => ({
            ...prev,
            [productId]: (prev[productId] || 0) + 1
        }));
    };

    const getTotalItems = () => Object.values(cart).reduce((a, b) => a + b, 0);
    const getTotalPrice = () => {
        return Object.entries(cart).reduce((total, [id, qty]) => {
            const product = products.find(p => p.id === id);
            return total + (product ? product.price * qty : 0);
        }, 0);
    };

    // --- CHAT LOGIC ---

    const initializeChat = async () => {
        if (!phone || !tenantId) return;

        // 1. Find or Create Lead
        let { data: lead } = await supabase
            .from('leads')
            .select('id')
            .eq('phone', phone)
            .eq('tenant_id', tenantId)
            .single();

        if (!lead) {
            const { data: newLead, error } = await supabase
                .from('leads')
                .insert([{
                    tenant_id: tenantId,
                    name: `Customer (${phone})`,
                    phone: phone,
                    status: 'new'
                }])
                .select()
                .single();

            if (error) {
                console.error("Error creating lead:", error);
                return;
            }
            lead = newLead;
        }

        if (lead) {
            setLeadId(lead.id);
            // 2. Fetch Messages
            const { data: msgs } = await supabase
                .from('messages')
                .select('*')
                .eq('lead_id', lead.id)
                .order('created_at', { ascending: true });

            setMessages(msgs || []);

            // 3. Subscribe to new messages (simplified for prototype: polling)
            // In a real app, use supabase.channel().subscribe()
        }
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !leadId || !tenantId) return;

        const content = newMessage;
        setNewMessage(""); // Optimistic clear

        // Optimistic UI
        const tempMsg = {
            id: 'temp-' + Date.now(),
            content,
            sender_type: 'lead' as const,
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, tempMsg]);

        try {
            await supabase.from('messages').insert([{
                tenant_id: tenantId,
                lead_id: leadId,
                content: content,
                sender_type: 'lead'
            }]);
            // Re-fetch to confirm and get actual ID (optional, skipped for speed)
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    // --- PAYMENT LOGIC ---

    const openPayment = () => {
        if (getTotalItems() === 0) {
            alert("Keranjang masih kosong");
            return;
        }
        setPaymentStep('review');
        setIsPaymentOpen(true);
    };

    const processPayment = async () => {
        if (!tenantId || !phone) return;
        setPaymentStep('paying');

        try {
            // 1. Ensure Lead Exists (Reuse logic or just assume chat initialized previously)
            // For safety, let's just use the same logic as chat or a simplified one
            let { data: lead } = await supabase
                .from('leads')
                .select('id')
                .eq('phone', phone)
                .eq('tenant_id', tenantId)
                .single();

            if (!lead) {
                // Fallback create lead
                const { data: newLead } = await supabase
                    .from('leads')
                    .insert([{ tenant_id: tenantId, name: `Customer (${phone})`, phone: phone, status: 'new' }])
                    .select().single();
                lead = newLead;
            }

            if (!lead) throw new Error("Could not create lead record");

            // 2. Create Order
            const totalAmount = getTotalPrice();
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert([{
                    tenant_id: tenantId,
                    lead_id: lead.id,
                    total_amount: totalAmount,
                    status: 'paid', // Instant success for simulation
                    payment_status: 'paid',
                    payment_method: 'bank_transfer'
                }])
                .select()
                .single();

            if (orderError) throw orderError;

            // 3. Insert Order Items (Optional for prototype, but good for completeness)
            // Skipped for brevity in this prototype, just recording the total order.

            setTimeout(() => {
                setPaymentStep('success');
                setCart({}); // Clear cart
            }, 1500); // Simulate network delay

        } catch (error) {
            console.error("Payment failed:", error);
            alert("Payment failed. See console.");
            setPaymentStep('review');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-10 p-4 shadow-sm">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Package className="h-6 w-6 text-primary" />
                        <h1 className="font-bold text-lg">Toko Online</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-right hidden sm:block">
                            <p className="font-medium text-gray-900">{phone}</p>
                            <p className="text-xs text-muted-foreground">Customer</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                            <LogOut className="h-4 w-4" />
                            Keluar
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-4xl mx-auto w-full p-4 pb-24">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">Katalog Produk</h2>
                    <Button onClick={openPayment} className="relative">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Checkout ({new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(getTotalPrice())})
                        {getTotalItems() > 0 && (
                            <Badge variant="destructive" className="absolute -top-2 -right-2 px-1.5 py-0.5 min-w-[20px] h-5 flex items-center justify-center text-xs">
                                {getTotalItems()}
                            </Badge>
                        )}
                    </Button>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground bg-white rounded-lg border border-dashed">
                        Belum ada produk yang tersedia.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {products.map((product) => (
                            <Card key={product.id} className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
                                <div className="aspect-video bg-muted flex items-center justify-center text-muted-foreground">
                                    <Package className="h-12 w-12 opacity-20" />
                                </div>
                                <CardHeader className="p-4 pb-2">
                                    <CardTitle className="text-lg line-clamp-1">{product.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 flex-1">
                                    <p className="text-2xl font-bold text-primary">
                                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(product.price)}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                        {product.description || "Tidak ada deskripsi"}
                                    </p>
                                    <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                                        <span className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                                        Stok: {product.stock}
                                    </div>
                                </CardContent>
                                <CardFooter className="p-4 pt-0">
                                    <Button
                                        className="w-full"
                                        onClick={() => addToCart(product.id)}
                                        disabled={product.stock <= 0}
                                    >
                                        {cart[product.id] ? `Tambah (+${cart[product.id]})` : "Beli Sekarang"}
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </main>

            {/* LIVE CHAT WIDGET */}
            <div className="fixed bottom-4 right-4 z-50">
                {!isChatOpen && (
                    <Button onClick={() => setIsChatOpen(true)} className="h-14 w-14 rounded-full shadow-lg gap-0 p-0 bg-primary hover:bg-primary/90">
                        <MessageCircle className="h-6 w-6" />
                        <span className="sr-only">Chat</span>
                    </Button>
                )}

                {isChatOpen && (
                    <Card className="w-[350px] shadow-2xl border-primary/20 animate-in slide-in-from-bottom-5">
                        <CardHeader className="p-4 bg-primary text-primary-foreground rounded-t-lg flex flex-row items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="bg-white/20 p-1.5 rounded-full">
                                    <MessageCircle className="h-4 w-4" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm font-bold">Live Support</CardTitle>
                                    <p className="text-xs opacity-80">Online</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-white/20" onClick={() => setIsChatOpen(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-4 h-[300px] overflow-y-auto bg-gray-50" ref={scrollRef}>
                            <div className="space-y-3">
                                <div className="flex justify-start">
                                    <div className="bg-white border rounded-lg p-2 max-w-[80%] text-sm shadow-sm">
                                        Halo! Ada yang bisa kami bantu?
                                    </div>
                                </div>
                                {messages.map((msg) => (
                                    <div key={msg.id} className={`flex ${msg.sender_type === 'lead' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`rounded-lg p-2 max-w-[80%] text-sm shadow-sm ${msg.sender_type === 'lead'
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-white border'
                                            }`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="p-3 border-t bg-white">
                            <form onSubmit={sendMessage} className="flex w-full gap-2">
                                <Input
                                    placeholder="Ketik pesan..."
                                    className="flex-1 h-9 text-sm"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                />
                                <Button type="submit" size="icon" className="h-9 w-9">
                                    <Send className="h-4 w-4" />
                                </Button>
                            </form>
                        </CardFooter>
                    </Card>
                )}
            </div>

            {/* PAYMENT SIMULATOR MODAL */}
            <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Pembayaran</DialogTitle>
                        <DialogDescription>Selesaikan pembayaran Anda untuk memproses pesanan.</DialogDescription>
                    </DialogHeader>

                    {paymentStep === 'review' && (
                        <div className="space-y-4 py-4">
                            <div className="rounded-lg border p-4 bg-muted/20">
                                <div className="flex justify-between mb-2 font-medium">
                                    <span>Total Item</span>
                                    <span>{getTotalItems()} pcs</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg border-t pt-2">
                                    <span>Total Bayar</span>
                                    <span>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(getTotalPrice())}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Pilih Metode Pembayaran</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button variant="outline" className="border-primary bg-primary/5">Transfer Bank</Button>
                                    <Button variant="outline" disabled>E-Wallet (Coming Soon)</Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {paymentStep === 'paying' && (
                        <div className="py-8 flex flex-col items-center justify-center space-y-4 text-center animate-in fade-in">
                            <CreditCard className="h-16 w-16 text-primary animate-pulse" />
                            <p className="text-lg font-medium">Memproses Pembayaran...</p>
                            <p className="text-sm text-muted-foreground">Mohon tunggu sebentar.</p>
                        </div>
                    )}

                    {paymentStep === 'success' && (
                        <div className="py-8 flex flex-col items-center justify-center space-y-4 text-center animate-in zoom-in-50">
                            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle2 className="h-10 w-10 text-green-600" />
                            </div>
                            <p className="text-xl font-bold text-green-700">Pembayaran Berhasil!</p>
                            <p className="text-sm text-muted-foreground">Order Anda telah diterima dan akan segera diproses.</p>
                        </div>
                    )}

                    <DialogFooter>
                        {paymentStep === 'review' && (
                            <Button onClick={processPayment} className="w-full">Bayar Sekarang</Button>
                        )}
                        {paymentStep === 'success' && (
                            <Button onClick={() => setIsPaymentOpen(false)} className="w-full">Tutup</Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
