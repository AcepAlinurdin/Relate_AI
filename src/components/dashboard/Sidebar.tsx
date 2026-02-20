'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MessageSquare, Workflow, CreditCard, Settings, Lock, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTier } from '@/contexts/TierContext';

export function Sidebar() {
    const pathname = usePathname();
    // Connect to global Tier Context
    const { tier, status } = useTier();

    const isTier1 = tier === 1;
    const isPending = status !== 'active';

    const links = [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, locked: isPending },
        { href: '/dashboard/inbox', label: 'Chat', icon: MessageSquare, locked: isPending },
        { href: '/dashboard/products', label: 'Data Produk', icon: Workflow, locked: isPending },
        { href: '/dashboard/orders', label: 'History Payment', icon: CreditCard, locked: isPending || isTier1 },
        { href: '/dashboard/settings', label: 'Pengaturan', icon: Settings, locked: isPending }, // Locked if pending
        { href: '/dashboard/billing', label: 'Langganan', icon: CreditCard, locked: false }, // Always allow billing
    ];

    return (
        <div className="flex h-full w-64 flex-col border-r bg-muted/10">
            <div className="border-b p-6">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                    <span className="">Relate AI</span>
                </Link>
                <div className="mt-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                        {tier === 1 ? 'Chatbot Plan (Tier 1)' : 'AI Agent Plan (Tier 2)'}
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-auto py-4">
                <nav className="grid items-start px-4 text-sm font-medium">
                    {links.map((link) => (
                        <Link
                            key={link.href}
                            href={link.locked ? '#' : link.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                                "text-muted-foreground hover:bg-muted",
                                pathname === link.href && "bg-muted text-primary font-bold",
                                link.locked && "cursor-not-allowed opacity-60 hover:text-muted-foreground"
                            )}
                        >
                            <link.icon className="h-4 w-4" />
                            {link.label}
                            {link.locked && <Lock className="ml-auto h-3 w-3" />}
                        </Link>
                    ))}
                </nav>
            </div>

            <div className="mt-auto p-4 border-t">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                    onClick={async () => {
                        const { createClient } = await import("@/utils/supabase/client");
                        const supabase = createClient();
                        await supabase.auth.signOut();
                        window.location.href = '/login';
                    }}
                >
                    <LogOut className="h-4 w-4" />
                    Log Out
                </Button>
            </div>
        </div>
    );
}
