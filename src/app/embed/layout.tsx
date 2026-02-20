import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Chat Widget",
    description: "RelateAI Chat Widget",
};

export default function EmbedLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <div className="min-h-screen bg-transparent">
                    {children}
                </div>
            </body>
        </html>
    );
}
