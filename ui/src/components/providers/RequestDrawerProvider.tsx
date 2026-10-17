"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export type RequestDrawerMode = "view" | "edit" | "create";

interface RequestDrawerContextValue {
  isOpen: boolean;
  orderId: string | null;
  mode: RequestDrawerMode;
  openView: (orderId: string) => void;
  openCreate: () => void;
  close: () => void;
  setMode: (mode: RequestDrawerMode) => void;
}

const RequestDrawerContext = createContext<RequestDrawerContextValue | null>(
  null,
);

export function useRequestDrawer(): RequestDrawerContextValue {
  const context = useContext(RequestDrawerContext);
  if (!context) {
    throw new Error(
      "useRequestDrawer must be used within a RequestDrawerProvider",
    );
  }
  return context;
}

interface RequestDrawerProviderProps {
  children: React.ReactNode;
}

// Drawer state owner mounted in (business)/layout.tsx. The SWR cache stays
// the single source of truth: the drawer resolves its order by id from the
// cache at render time (no second fetch, no waterfall). Mode resets inside
// the open/close event handlers, never in effects.
export const RequestDrawerProvider: React.FC<RequestDrawerProviderProps> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [mode, setMode] = useState<RequestDrawerMode>("view");

  const openView = useCallback((id: string) => {
    setOrderId(id);
    setMode("view");
    setIsOpen(true);
  }, []);

  const openCreate = useCallback(() => {
    setOrderId(null);
    setMode("create");
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setOrderId(null);
    setMode("view");
  }, []);

  const value: RequestDrawerContextValue = {
    isOpen,
    orderId,
    mode,
    setMode,
    openView,
    openCreate,
    close,
  };

  return (
    <RequestDrawerContext.Provider value={value}>
      {children}
    </RequestDrawerContext.Provider>
  );
};
