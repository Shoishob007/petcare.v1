import type { ReactNode, Metadata } from "next";
import { Inter, DM_Sans } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "./components/Toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "PetCare Hub - Pet Community & Care Platform",
  description:
    "Connect with your pet community. Share pet sightings, health tips, and care coordination all in one place.",
  keywords: [
    "pets",
    "pet care",
    "veterinarian",
    "grooming",
    "community",
    "lost pet",
  ],
  authors: [{ name: "PetCare Hub" }],
  viewport: "width=device-width, initial-scale=1.0, maximum-scale=5.0",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://petcarehub.com",
    siteName: "PetCare Hub",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${dmSans.variable} scroll-smooth`}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <meta name="theme-color" content="#1f5c4a" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="bg-background text-foreground antialiased">
        <ToastProvider>
          <div className="flex min-h-screen flex-col">{children}</div>
        </ToastProvider>
      </body>
    </html>
  );
}
