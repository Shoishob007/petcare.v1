import Sidebar from "@/src/components/Sidebar";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen bg-surface text-on-surface">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">
                <main className="flex-1 overflow-x-hidden px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
