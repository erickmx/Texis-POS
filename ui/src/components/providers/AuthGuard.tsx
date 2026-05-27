"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const params = useParams();
  const lng = (params?.lng as string) || "es";
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getCookie = (name: string): string | undefined => {
      const match = document.cookie.split("; ").find((c) => c.trim().startsWith(`${name}=`));
      return match ? decodeURIComponent(match.split("=")[1]) : undefined;
    };

    const setCookie = (name: string, value: string, maxAge: number) => {
      const secure = window.location.protocol === "https:";
      document.cookie = `${name}=${value}; max-age=${maxAge}; path=/; samesite=lax${secure ? "; secure" : ""}`;
    };

    const deleteCookie = (name: string) => {
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
    };

    const checkAuth = async () => {
      let token = getCookie("user_token");

      // Sync from localStorage if missing in cookie
      if (!token) {
        token = localStorage.getItem("user_token") || undefined;
        if (token) {
          // Sync to cookie
          setCookie("user_token", token, 86400); // 24 hours
        }
      } else {
        // Sync to localStorage if missing or different
        if (localStorage.getItem("user_token") !== token) {
          localStorage.setItem("user_token", token);
        }
      }

      if (!token) {
        // No token, redirect to login
        deleteCookie("user_token");
        localStorage.removeItem("user_token");
        router.replace(`/${lng}/login?auth_error=expired`);
        return;
      }

      // Validate token
      let tokenValid = false;
      let shouldRefresh = false;
      interface JWTPayload {
        exp: number;
        iat: number;
      }
      let payload: JWTPayload | null = null;

      try {
        const parts = token.split(".");
        if (parts.length === 3) {
          const parsed = JSON.parse(atob(parts[1])) as JWTPayload;
          payload = parsed;
          const exp = parsed.exp * 1000;
          const iat = parsed.iat * 1000;

          if (Date.now() < exp) {
            tokenValid = true;
            // Silent refresh if issued > 1 hour ago
            if (Date.now() - iat > 3600 * 1000) {
              shouldRefresh = true;
            }
          }
        }
      } catch (e) {
        // Invalid format
      }

      if (!tokenValid) {
        deleteCookie("user_token");
        localStorage.removeItem("user_token");
        router.replace(`/${lng}/login?auth_error=expired`);
        return;
      }

      // Silent refresh
      if (shouldRefresh) {
        try {
          const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
          const res = await fetch(`${apiBaseUrl}/api/refresh`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (res.ok) {
            const data = await res.json();
            if (data.token) {
              setCookie("user_token", data.token, 86400);
              localStorage.setItem("user_token", data.token);
            }
          } else if (res.status === 401) {
            // Token expired on server or blacklisted
            deleteCookie("user_token");
            localStorage.removeItem("user_token");
            router.replace(`/${lng}/login?auth_error=expired`);
            return;
          }
        } catch (err) {
          console.error("Silent refresh failed in AuthGuard:", err);
          // If we couldn't connect, but the current token is not yet expired,
          // we can allow the user to continue using the app.
        }
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [router, lng]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-on-surface-variant font-body">
        <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  return <>{children}</>;
}
