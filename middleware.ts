import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('mo_token')?.value;
  const accountType = request.cookies.get('mo_account_type')?.value;

  const isAdminRoute = pathname.startsWith('/dashboard');
  const isMerchantRoute = pathname.startsWith('/merchant');

  if (!isAdminRoute && !isMerchantRoute) {
    return NextResponse.next();
  }

  if (!token) {
    const loginUrl = new URL('/', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute && accountType === 'merchant') {
    return NextResponse.redirect(new URL('/merchant', request.url));
  }

  if (isMerchantRoute && accountType === 'admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/merchant/:path*']
};
