'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MessageSquare, Workflow, CreditCard, Settings, Lock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTier } from '@/contexts/TierContext';

export function Sidebar() {
    const pathname = usePathname();
    const { tier, setTier } = useTier();

    // Mock tenant data based on tier
    const tenant = {
        company_name: "Demo Store",
        subscription_tier: tier
    };

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
                    {tenant.company_name} <br />
                    <span className="font-medium text-foreground">
                        {tier === 1 ? 'Chatbot Plan (Tier 1)' : 'AI Agent Plan (Tier 2)'}
                    </span>
                </div>
            </div>

            {/* Tier Switcher for Prototype */}
            <div className="px-4 py-2">
                <div className="flex items-center justify-between rounded-md border bg-background p-2 shadow-sm">
                    <span className="text-xs font-medium">Switch Tier:</span>
                    <div className="flex gap-1">
                        <Button
                            variant={tier === 1 ? "default" : "ghost"}
                            size="xs"
                            onClick={() => setTier(1)}
                            className="h-6 px-2 text-[10px]"
                        >
                            T1
                        </Button>
                        <Button
                            variant={tier === 2 ? "default" : "ghost"}
                            size="xs"
                            onClick={() => setTier(2)}
                            className="h-6 px-2 text-[10px]"
                        >
                            T2
                        </Button>
                    </div>
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
                                pathname === link.href ? "bg-muted text-primary" : "text-muted-foreground",
                                link.locked && "cursor-not-allowed opacity-60 hover:text-muted-foreground"
                            )}
                            onClick={(e) => link.locked && e.preventDefault()}
                        >
                            <link.icon className="h-4 w-4" />
                            {link.label}
                            {link.locked && <Lock className="ml-auto h-3 w-3" />}
                        </Link>
                    ))}
                </nav>
            </div>
            {isTier1 && (
                <div className="p-4">
                    <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
                        <h4 className="flex items-center gap-2 text-sm font-semibold">
                            <Zap className="h-4 w-4 fill-primary text-primary" />
                            Upgrade to Pro
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                            Unlock Automations & Payments.
                        </p>
                        <Button size="sm" className="mt-3 w-full" variant="secondary" onClick={() => setTier(2)}>
                            Try Tier 2
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

