import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X } from 'lucide-react';

export function PricingSection() {
    return (
        <section id="pricing" className="container mx-auto py-8 md:py-12 lg:py-24">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
                <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">Biaya Langganan</h2>
                <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                    Investasi terjangkau untuk otomatisasi bisnis Anda.
                </p>
            </div>
            <div className="grid w-full gap-10 rounded-lg p-4 md:p-10 md:grid-cols-2">
                {/* Tier 1 */}
                <Card className="flex flex-col h-full">
                    <CardHeader>
                        <CardTitle className="text-2xl">Core (Tier 1)</CardTitle>
                        <CardDescription>Otomatisasi chat dasar & database customer.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <div className="text-4xl font-bold">Rp 99k <span className="text-lg font-normal text-muted-foreground">/ bulan</span></div>
                        <ul className="mt-4 space-y-3">
                            <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" /> Omnichannel Inbox</li>
                            <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" /> AI Auto Reply Produk & FAQ</li>
                            <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" /> Natural Conversation</li>
                            <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" /> Lead Classification Basic</li>
                            <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" /> Simpan Data Customer</li>
                            {/* Limitations */}
                            <li className="flex items-center text-muted-foreground"><X className="mr-2 h-4 w-4" /> Tidak Jualan Aktif</li>
                            <li className="flex items-center text-muted-foreground"><X className="mr-2 h-4 w-4" /> Tidak Follow-up Otomatis</li>
                            <li className="flex items-center text-muted-foreground"><X className="mr-2 h-4 w-4" /> Tidak Payment</li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Link href="/register?plan=1" className="w-full">
                            <Button className="w-full" variant="outline">Pilih Tier 1</Button>
                        </Link>
                    </CardFooter>
                </Card>

                {/* Tier 2 */}
                <Card className="relative border-2 border-primary flex flex-col shadow-xl bg-primary/5 h-full">
                    <div className="absolute -top-3 left-0 right-0 mx-auto w-fit rounded-full bg-primary px-4 py-1 text-sm font-medium text-primary-foreground shadow-sm">
                        Paling Laris
                    </div>
                    <CardHeader>
                        <CardTitle className="text-2xl">Sales Agent + Payment (Tier 2)</CardTitle>
                        <CardDescription>Salesman digital lengkap dengan payment.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <div className="text-4xl font-bold">Rp 199k <span className="text-lg font-normal text-muted-foreground">/ bulan</span></div>
                        <ul className="mt-4 space-y-3">
                            <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-primary" /> Omnichannel Inbox</li>
                            <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-primary" /> AI Auto Reply Produk & FAQ</li>
                            <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-primary" /> Natural Conversation</li>
                            <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-primary" /> Lead Classification Basic</li>
                            <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-primary" /> Simpan Data Customer</li>
                            <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-primary" /> <span><strong>AI Aktif Jualan</strong> (Closing)</span></li>
                            <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-primary" /> <span><strong>Auto Follow-up</strong> Buyer</span></li>
                            <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-primary" /> Lead Scoring Pintar</li>
                            <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-primary" /> Generate Payment Link Otomatis</li>
                            <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-primary" /> Payment Langsung di Chat</li>
                            <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-primary" /> Status Order Real Time</li>
                            <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-primary" /> Conversion Analytics</li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Link href="/register?plan=2" className="w-full">
                            <Button className="w-full" variant="default">Pilih Tier 2</Button>
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        </section>
    );
}
