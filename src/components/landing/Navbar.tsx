"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, X, Sparkles, CreditCard, LogIn, UserPlus } from 'lucide-react';
import { useState, useEffect } from 'react';

export function Navbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Lock body scroll when menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isMobileMenuOpen]);

    return (
        <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-14 max-w-screen-2xl items-center px-4">
                <div className="mr-4 flex">
                    <Link className="mr-6 flex items-center space-x-2" href="/">
                        <span className="font-bold inline-block text-lg">Relate AI</span>
                    </Link>
                    <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
                        <Link href="#features" className="transition-colors hover:text-foreground/80 text-foreground/60">Features</Link>
                        <Link href="#pricing" className="transition-colors hover:text-foreground/80 text-foreground/60">Pricing</Link>
                    </nav>
                </div>
                <div className="flex flex-1 items-center justify-end space-x-2">
                    <nav className="hidden md:flex items-center space-x-2">
                        <Link href="/login">
                            <Button variant="ghost" size="sm">Login</Button>
                        </Link>
                        <Link href="/register">
                            <Button size="sm">Get Started</Button>
                        </Link>
                    </nav>
                    {/* Mobile Menu Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        <span className="sr-only">Toggle menu</span>
                    </Button>
                </div>
            </div>

            {/* Modern Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 top-14 z-50 grid place-items-start bg-background md:hidden animate-in fade-in slide-in-from-top-5 duration-200">
                    <nav className="container grid gap-6 p-6 mx-auto bg-background h-full">
                        <div className="grid gap-4">
                            <p className="text-sm font-medium text-muted-foreground px-2">Menu</p>
                            <Link
                                href="#features"
                                className="flex items-center gap-3 rounded-md p-3 text-lg font-medium hover:bg-muted transition-colors"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <Sparkles className="h-5 w-5 text-primary" />
                                Features
                            </Link>
                            <Link
                                href="#pricing"
                                className="flex items-center gap-3 rounded-md p-3 text-lg font-medium hover:bg-muted transition-colors"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <CreditCard className="h-5 w-5 text-primary" />
                                Pricing
                            </Link>
                        </div>

                        <div className="grid gap-4 border-t pt-6">
                            <p className="text-sm font-medium text-muted-foreground px-2">Akun</p>
                            <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                                <Button variant="outline" className="w-full justify-start h-12 text-base" size="lg">
                                    <LogIn className="mr-2 h-5 w-5" />
                                    Masuk (Login)
                                </Button>
                            </Link>
                            <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                                <Button className="w-full justify-start h-12 text-base" size="lg">
                                    <UserPlus className="mr-2 h-5 w-5" />
                                    Daftar Sekarang
                                </Button>
                            </Link>
                        </div>
                    </nav>
                </div>
            )}
        </nav>
    );
}
