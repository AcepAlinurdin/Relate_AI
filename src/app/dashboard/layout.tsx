import { Sidebar } from '@/components/dashboard/Sidebar';
import { TierProvider } from '@/contexts/TierContext';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <TierProvider>
            <div className="flex h-screen w-full overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-y-auto bg-background p-8">
                    {children}
                </main>
            </div>
        </TierProvider>
    );
}
