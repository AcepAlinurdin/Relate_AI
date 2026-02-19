import { MessageSquare, Users, CreditCard, Zap } from 'lucide-react';

const features = [
    {
        title: "Omnichannel Inbox",
        description: "Gabungkan chat dari WhatsApp, Instagram, dan Website dalam satu dashboard. Tak perlu buka-tutup banyak aplikasi.",
        icon: MessageSquare,
    },
    {
        title: "AI Auto-Reply 24/7",
        description: "AI menjawab pertanyaan seputar produk, stok, dan harga secara instan, kapan saja pelanggan bertanya.",
        icon: Zap,
    },
    {
        title: "Lead Scoring & Follow-up",
        description: "Otomatis mendeteksi pembeli serius dan melakukan follow-up agar tidak ada penjualan yang lolos.",
        icon: Users,
    },
    {
        title: "Instant Payment Link",
        description: "Buat link pembayaran dan kirim langsung di chat. Terintegrasi dengan berbagai metode pembayaran.",
        icon: CreditCard,
    },
];

export function FeaturesSection() {
    return (
        <section id="features" className="container mx-auto space-y-6 py-8 md:py-12 lg:py-24 px-4">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
                <h2 className="font-heading text-3xl font-bold leading-[1.1] sm:text-3xl md:text-5xl">
                    Kenapa Relate AI?
                </h2>
                <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                    Fitur lengkap untuk membantu Anda fokus jualan, bukan balas chat.
                </p>
            </div>
            <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-2 lg:gap-8">
                {features.map((feature) => (
                    <div key={feature.title} className="relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:border-primary/20">
                        <div className="flex h-full flex-col justify-between p-6">
                            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                                <feature.icon className="h-6 w-6 text-primary" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-bold text-xl">{feature.title}</h3>
                                <p className="text-muted-foreground">{feature.description}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
