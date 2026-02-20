import { createAdminClient } from '@/utils/supabase/server';
import { unstable_cache } from 'next/cache';
import { revalidateTag } from 'next/cache';

export interface Product {
    id: string;
    name: string;
    price: number;
    stock: number;
    description: string;
    created_at: string;
    tenant_id: string;
}

export const getCachedProducts = unstable_cache(
    async (tenantId: string) => {
        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error(`Error fetching products for tenant ${tenantId}:`, error);
            return [];
        }

        return data as Product[];
    },
    ['tenant-products'],
    {
        tags: ['products'],
        revalidate: 3600
    }
);

export async function revalidateProducts() {
    revalidateTag('products');
}
