"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

type Tier = 1 | 2;

interface TierContextType {
    tier: Tier;
    setTier: (tier: Tier) => void;
}

const TierContext = createContext<TierContextType | undefined>(undefined);

export function TierProvider({ children }: { children: ReactNode }) {
    const [tier, setTier] = useState<Tier>(2); // Default to Tier 2 (Pro) for showcase

    return (
        <TierContext.Provider value={{ tier, setTier }}>
            {children}
        </TierContext.Provider>
    );
}

export function useTier() {
    const context = useContext(TierContext);
    if (context === undefined) {
        throw new Error('useTier must be used within a TierProvider');
    }
    return context;
}
