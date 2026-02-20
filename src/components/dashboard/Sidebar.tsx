'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MessageSquare, Workflow, CreditCard, Settings, Lock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTier } from '@/contexts/TierContext';

export function Sidebar() {
    const pathname = usePathname();
    // In a real app, this should come from a context or a hook that fetches the tenant profile
    // For now, we'll default to Tier 2 if not loaded, or fetch it.
    // Ideally: const { tenant } = useTenant();
    const tier = 2; // Default to Pro for now until we hook up the Context

    const isTier1 = tier === 1;

    const links = [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, locked: false },
        { href: '/dashboard/inbox', label: 'Chat', icon: MessageSquare, locked: false },
        { href: '/dashboard/products', label: 'Data Produk', icon: Workflow, locked: false },
        { href: '/dashboard/orders', label: 'History Payment', icon: CreditCard, locked: isTier1 }, // Locked for Tier 1
        { href: '/dashboard/settings', label: 'Pengaturan', icon: Settings, locked: false },
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
        </div>
    );
}

