"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type Tier = 1 | 2;

interface TierContextType {
    tier: Tier;
    status: string;
    setTier: (tier: Tier) => void;
    refreshTier: () => Promise<void>;
}

const TierContext = createContext<TierContextType | undefined>(undefined);

interface TierProviderProps {
    children: ReactNode;
    initialTier?: Tier;
    initialStatus?: string;
}

export function TierProvider({ children, initialTier = 2, initialStatus = 'active' }: TierProviderProps) {
    console.log("TierProvider Rendering", { initialTier, initialStatus });
    const [tier, setTier] = useState<Tier>(initialTier);
    const [status, setStatus] = useState<string>(initialStatus);

    // Sync from Server Props (Important for hydration stability if layout re-renders with new data)
    useEffect(() => {
        if (initialStatus !== status) setStatus(initialStatus);
        if (initialTier !== tier) setTier(initialTier);
    }, [initialStatus, initialTier, status, tier]);

    const refreshTier = async () => {
        console.log("Refreshing tier...");
        // In real app, re-fetch via server action or api
    };

    return (
        <TierContext.Provider value={{ tier, status, setTier, refreshTier }}>
            {children}
        </TierContext.Provider>
    );
}

export function useTier() {
    const context = useContext(TierContext);
    if (context === undefined) {
        // If we hit this, it means the component is rendered outside the Provider.
        // On the client, this shouldn't happen if wrapped correctly in layout.
        // However, during hydration, if there's a mismatch, we might see this.

        // Return a safe "Loading" state or match server default to avoid hydration error
        return {
            tier: 2 as Tier, // Default to Tier 2 (active) to match likely server state for "Upgrade Now"
            status: 'active', // Assume active if missing to prevent "Bayar..." lock mismatch
            setTier: () => { },
            refreshTier: async () => { }
        };
    }
    return context;
}
