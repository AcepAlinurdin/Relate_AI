"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

interface SubscriptionGuardProps {
    status: string; // 'active', 'pending_payment', 'expired'
    children: React.ReactNode;
}

export function SubscriptionGuard({ status, children }: SubscriptionGuardProps) {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Allow access to billing and settings (for logout/upgrade)
        // Also allow access if status is active
        const isAllowedPath = pathname?.startsWith('/dashboard/billing') || pathname?.startsWith('/dashboard/settings');
        const isActive = status === 'active';

        if (!isActive && !isAllowedPath) {
            router.push('/dashboard/billing');
        }
    }, [status, pathname, router]);

    // Optionally: could show a loading spinner or "Access Denied" if we want to block rendering entirely
    // But since we redirect, rendering children briefly is okay, or we can just render null if redirecting.

    return <>{children}</>;
}
