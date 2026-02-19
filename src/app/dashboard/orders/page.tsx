"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Loader2, PlusCircle, RefreshCw } from "lucide-react";

interface Order {
    id: string;
    total_amount: number;
    status: 'pending' | 'paid' | 'processing' | 'completed' | 'cancelled';
    created_at: string;
    lead_id: string | null;
}

export default function HistoryPaymentPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: tenant } = await supabase
                .from('tenants')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!tenant) return;

            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('tenant_id', tenant.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (orderId: string, newStatus: Order['status']) => {
        setUpdating(orderId);
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId);

            if (error) throw error;
            await fetchOrders();
        } catch (error) {
            console.error("Error updating order:", error);
        } finally {
            setUpdating(null);
        }
    };

    const createDummyOrder = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data: tenant } = await supabase.from('tenants').select('id').eq('user_id', user.id).single();
            if (!tenant) return;

            await supabase.from('orders').insert([{
                tenant_id: tenant.id,
                total_amount: Math.floor(Math.random() * 100000) + 15000,
                status: 'pending'
            }]);
            fetchOrders();
        } catch (error) {
            console.error("Error creating dummy order:", error);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
            case 'paid': return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Paid</Badge>;
            case 'processing': return <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">Processing</Badge>;
            case 'completed': return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
            case 'cancelled': return <Badge variant="destructive">Cancelled</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">History Payment & Orders</h2>
                    <p className="text-muted-foreground">Kelola pesanan dan status pembayaran.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchOrders} title="Refresh">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button onClick={createDummyOrder} variant="secondary" size="sm">
                        <PlusCircle className="mr-2 h-4 w-4" /> Test Order
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Pesanan</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order ID</TableHead>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : orders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        Belum ada order. Klik "Test Order" untuk simulasi.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                orders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}...</TableCell>
                                        <TableCell>{new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString()}</TableCell>
                                        <TableCell>Rp {order.total_amount.toLocaleString('id-ID')}</TableCell>
                                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {order.status === 'pending' && (
                                                    <Button size="xs" variant="outline" onClick={() => updateStatus(order.id, 'paid')} disabled={!!updating}>
                                                        {updating === order.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Mark Paid"}
                                                    </Button>
                                                )}
                                                {order.status === 'paid' && (
                                                    <Button size="xs" variant="default" onClick={() => updateStatus(order.id, 'processing')} disabled={!!updating}>
                                                        Process
                                                    </Button>
                                                )}
                                                {order.status === 'processing' && (
                                                    <Button size="xs" variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => updateStatus(order.id, 'completed')} disabled={!!updating}>
                                                        Complete
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
