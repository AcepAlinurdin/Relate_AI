import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function Hero() {
    return (
        <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
            <div className="container mx-auto flex max-w-[64rem] flex-col items-center gap-4 text-center px-4">
                <div className="rounded-2xl bg-muted px-4 py-1.5 text-sm font-medium">
                    🚀 CRM AI Omnichannel No. #1 untuk UMKM
                </div>
                <h1 className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                    Asisten Sales AI <br className="hidden sm:inline" />
                    <span className="text-primary">untuk UMKM Indonesia</span>
                </h1>
                <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
                    Urus chat pelanggan dari <strong>WhatsApp, Instagram, dan Marketplace</strong> dalam satu tempat.
                    Otomatis follow-up, jawab pertanyaan produk, dan terima pembayaran tanpa ribet.
                </p>
                <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 pt-4 w-full sm:w-auto">
                    <Link href="/register" className="w-full sm:w-auto">
                        <Button size="lg" className="h-12 px-8 text-lg w-full sm:w-auto">Coba Gratis Sekarang</Button>
                    </Link>
                    <Link href="#features" className="w-full sm:w-auto">
                        <Button variant="outline" size="lg" className="h-12 px-8 text-lg w-full sm:w-auto">Pelajari Fitur</Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
