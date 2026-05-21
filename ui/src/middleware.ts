import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import acceptLanguage from 'accept-language';
import { fallbackLng, languages, cookieName } from './i18n/settings';

acceptLanguage.languages(languages);

export const config = {
  // matcher: '/:lng*'
  matcher: ['/((?!api|_next/static|_next/image|assets|favicon.ico|sw.js|images).*)']
};

export async function middleware(req: NextRequest) {
  let lng;
  if (req.cookies.has(cookieName)) lng = acceptLanguage.get(req.cookies.get(cookieName)?.value);
  if (!lng) lng = acceptLanguage.get(req.headers.get('Accept-Language'));
  if (!lng) lng = fallbackLng;

  const pathname = req.nextUrl.pathname;

  // Redirect if lng in path is not supported
  if (
    !languages.some(loc => pathname.startsWith(`/${loc}`)) &&
    !pathname.startsWith('/_next')
  ) {
    return NextResponse.redirect(new URL(`/${lng}${pathname}`, req.url));
  }

  const currentLng = languages.find((l) => pathname.startsWith(`/${l}`)) || lng;

  const isLoginRoute = pathname === `/${currentLng}/login` || pathname === `/login`;
  const isProtectedRoute = pathname.startsWith(`/${currentLng}/inventory`) || pathname === `/${currentLng}`;

  const token = req.cookies.get('user_token')?.value;
  let tokenValid = false;
  let shouldRefresh = false;

  if (token) {
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        const exp = payload.exp * 1000;
        const iat = payload.iat * 1000;

        if (Date.now() < exp) {
          tokenValid = true;
          // Refresh token if it was issued more than 1 hour ago
          if (Date.now() - iat > 3600 * 1000) {
            shouldRefresh = true;
          }
        }
      }
    } catch (e) {
      // Invalid format
    }
  }

  // Handle route protection
  if (isProtectedRoute) {
    if (!tokenValid) {
      const response = NextResponse.redirect(new URL(`/${currentLng}/login?auth_error=expired`, req.url));
      response.cookies.delete('user_token');
      return response;
    }

    if (pathname === `/${currentLng}`) {
      return NextResponse.redirect(new URL(`/${currentLng}/inventory`, req.url));
    }
  }

  if (isLoginRoute && tokenValid) {
    return NextResponse.redirect(new URL(`/${currentLng}/inventory`, req.url));
  }

  // Prepare response
  let response = NextResponse.next();

  // Handle silent token refresh
  if (tokenValid && shouldRefresh && token) {
    try {
      const refreshRes = await fetch('http://localhost:8080/api/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (refreshRes.ok) {
        const data = await refreshRes.json();
        response.cookies.set('user_token', data.token, {
          maxAge: 86400, // 24 hours
          path: '/',
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        });
      }
    } catch (err) {
      console.error('Silent token refresh failed in middleware:', err);
    }
  }

  // Handle referer setting
  if (req.headers.has('referer')) {
    const refererUrl = new URL(req.headers.get('referer')!);
    const lngInReferer = languages.find((l) => refererUrl.pathname.startsWith(`/${l}`));
    if (lngInReferer) {
      response.cookies.set(cookieName, lngInReferer);
    }
  }

  return response;
}
