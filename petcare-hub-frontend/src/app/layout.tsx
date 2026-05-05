import type { Metadata } from "next";
import "../index.css";

export const metadata: Metadata = {
    title: "PetCare Hub",
    description: "PetCare Hub frontend migrated to Next.js",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
