'use server';

import { createClient } from '@/utils/supabase/server';
import { getCachedProducts, revalidateProducts } from '@/services/product-server';

export async function getProductsAction() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (!tenant) return [];

    return await getCachedProducts(tenant.id);
}

export async function createProductAction(formData: { name: string, price: number, stock: number, description: string }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (!tenant) throw new Error('Tenant not found');

    const { error } = await supabase.from('products').insert([
        {
            tenant_id: tenant.id,
            name: formData.name,
            price: formData.price,
            stock: formData.stock,
            description: formData.description,
        }
    ]);

    if (error) throw error;
    await revalidateProducts();
}

export async function updateProductAction(id: string, formData: { name: string, price: number, stock: number, description: string }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (!tenant) throw new Error('Tenant not found');

    const { error } = await supabase.from('products')
        .update({
            name: formData.name,
            price: formData.price,
            stock: formData.stock,
            description: formData.description,
        })
        .eq('id', id)
        .eq('tenant_id', tenant.id);

    if (error) throw error;
    await revalidateProducts();
}

export async function deleteProductAction(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (!tenant) throw new Error('Tenant not found');

    const { error } = await supabase.from('products').delete().eq('id', id).eq('tenant_id', tenant.id);

    if (error) throw error;
    await revalidateProducts();
}
