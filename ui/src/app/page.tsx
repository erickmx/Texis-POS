"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootIndexPage() {
  const router = useRouter();

  useEffect(() => {
    // 1. Determine locale
    let lng = "es"; // default fallback

    const getCookie = (name: string): string | undefined => {
      const match = document.cookie.split("; ").find((c) => c.trim().startsWith(`${name}=`));
      return match ? decodeURIComponent(match.split("=")[1]) : undefined;
    };

    const cookieLng = getCookie("i18next");
    if (cookieLng === "en" || cookieLng === "es") {
      lng = cookieLng;
    } else {
      const navLng = navigator.language?.split("-")[0];
      if (navLng === "en" || navLng === "es") {
        lng = navLng;
      }
    }

    // 2. Check user token validity
    let token = getCookie("user_token");
    if (!token && typeof window !== "undefined") {
      token = localStorage.getItem("user_token") || undefined;
    }

    let isTokenValid = false;
    if (token) {
      try {
        const parts = token.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          const exp = payload.exp * 1000;
          if (Date.now() < exp) {
            isTokenValid = true;
          }
        }
      } catch (e) {
        // invalid token
      }
    }

    // 3. Redirect
    if (isTokenValid) {
      router.replace(`/${lng}/inventory`);
    } else {
      router.replace(`/${lng}/login`);
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-on-surface-variant font-body">
      <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
  );
}
