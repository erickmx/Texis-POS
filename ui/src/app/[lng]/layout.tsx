import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Work_Sans } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "../globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Talavera Folio | Texis-POS",
  description: "Tactile inventory management for premium stationery.",
};

export async function generateStaticParams() {
  return [{ lng: 'en' }, { lng: 'es' }];
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lng: string }>;
}) {
  const { lng } = await params;
  return (
    <html
      lang={lng}
      className={`${plusJakartaSans.variable} ${workSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-on-surface">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#ffffff',
              color: '#1a1c1c',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              boxShadow: '0 8px 32px rgba(26, 28, 28, 0.06)',
              borderRadius: '0.75rem',
              fontSize: '0.875rem',
              fontWeight: 500,
            },
          }}
        />
      </body>
    </html>
  );
}
