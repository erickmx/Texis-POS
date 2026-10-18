import React from "react";
import { Sidebar } from "@/components/business/Sidebar";
import { Navbar } from "@/components/business/Navbar";
import { InventoryModalProvider } from "@/components/providers/InventoryModalProvider";
import { RequestDrawerProvider } from "@/components/providers/RequestDrawerProvider";
import { RequestDrawer } from "@/components/special-requests/RequestDrawer";
import { SWRProvider } from "@/components/providers/SWRProvider";
import { ProductModal } from "@/components/inventory/ProductModal";
import { AuthGuard } from "@/components/providers/AuthGuard";

export default async function BusinessLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lng: string }>;
}) {
  const { lng } = await params;
  return (
    <AuthGuard>
      <SWRProvider>
        <InventoryModalProvider>
          <RequestDrawerProvider>
            <div className="flex h-screen bg-background overflow-hidden">
              <Sidebar lng={lng} />
              <div className="flex-1 flex flex-col min-w-0">
                <Navbar lng={lng} />
                <main className="flex-1 overflow-y-auto bg-background">
                  {children}
                </main>
              </div>
            </div>
            <ProductModal lng={lng} />
            <RequestDrawer lng={lng} />
          </RequestDrawerProvider>
        </InventoryModalProvider>
      </SWRProvider>
    </AuthGuard>
  );
}
