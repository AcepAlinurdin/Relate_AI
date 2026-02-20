"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, BrainCircuit, Loader2, Trash2, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

// Type definition for Product
interface Product {
    id: string;
    name: string;
    price: number;
    stock: number;
    description: string;
    created_at: string;
}

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        price: "",
        stock: "",
        description: ""
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get tenant first
            const { data: tenant } = await supabase
                .from('tenants')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!tenant) return;

            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('tenant_id', tenant.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProducts(data || []);
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: tenant } = await supabase
                .from('tenants')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!tenant) return;

            if (editingId) {
                // Update existing product
                const { error } = await supabase.from('products')
                    .update({
                        name: formData.name,
                        price: parseFloat(formData.price),
                        stock: parseInt(formData.stock) || 0,
                        description: formData.description,
                    })
                    .eq('id', editingId)
                    .eq('tenant_id', tenant.id);

                if (error) throw error;
            } else {
                // Create new product
                const { error } = await supabase.from('products').insert([
                    {
                        tenant_id: tenant.id,
                        name: formData.name,
                        price: parseFloat(formData.price),
                        stock: parseInt(formData.stock) || 0,
                        description: formData.description,
                    }
                ]);

                if (error) throw error;
            }

            setIsDialogOpen(false);
            setFormData({ name: "", price: "", stock: "", description: "" });
            setEditingId(null);
            fetchProducts();
        } catch (error) {
            console.error("Error saving product:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (product: Product) => {
        setFormData({
            name: product.name,
            price: product.price.toString(),
            stock: product.stock.toString(),
            description: product.description
        });
        setEditingId(product.id);
        setIsDialogOpen(true);
    };

    const handleOpenChange = (open: boolean) => {
        setIsDialogOpen(open);
        if (!open) {
            setFormData({ name: "", price: "", stock: "", description: "" });
            setEditingId(null);
        }
    };

    const handleDeleteProduct = async (id: string) => {
        if (!confirm("Are you sure you want to delete this product?")) return;

        try {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) throw error;
            fetchProducts();
        } catch (error) {
            console.error("Error deleting product:", error);
        }
    }

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Data Produk (AI Knowledge)</h2>
                    <p className="text-muted-foreground">
                        Data ini akan dipelajari oleh AI untuk menjawab pertanyaan pelanggan.
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Tambah Produk
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingId ? 'Edit Produk' : 'Tambah Produk Baru'}</DialogTitle>
                            <DialogDescription>
                                {editingId ? 'Perbarui informasi produk di bawah ini.' : 'Isi form di bawah untuk menambahkan produk baru.'}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSaveProduct} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nama Produk</Label>
                                <Input id="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="price">Harga (Rp)</Label>
                                    <Input id="price" type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="stock">Stok</Label>
                                    <Input id="stock" type="number" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Deskripsi</Label>
                                <Input id="description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} required />
                            </div>
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? "Menyimpan..." : "Simpan Produk"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cari produk..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nama Produk</TableHead>
                            <TableHead>Harga</TableHead>
                            <TableHead>Stok</TableHead>
                            <TableHead>Deskripsi (untuk AI)</TableHead>
                            <TableHead className="w-[100px]">Status AI</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : filteredProducts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    Belum ada produk. Silakan tambah produk baru.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredProducts.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell>Rp {product.price.toLocaleString('id-ID')}</TableCell>
                                    <TableCell>{product.stock}</TableCell>
                                    <TableCell className="max-w-md truncate" title={product.description}>
                                        {product.description}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-green-600">
                                            <BrainCircuit className="h-4 w-4" />
                                            <span className="text-xs font-medium">Synced</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(product)} className="mr-1">
                                            <Pencil className="h-4 w-4 text-primary" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(product.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
