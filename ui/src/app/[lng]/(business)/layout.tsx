import React from 'react';
import { Sidebar } from '@/components/business/Sidebar';
import { Navbar } from '@/components/business/Navbar';

export default async function BusinessLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lng: string }>;
}) {
  const { lng } = await params;
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar lng={lng} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar lng={lng} />
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
