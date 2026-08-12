import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role;
    const { pathname } = req.nextUrl;

    if (pathname.startsWith('/pengawas') && role !== 'PENGAWAS') {
      return NextResponse.redirect(new URL('/admin', req.url));
    }

    if (pathname.startsWith('/admin') && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/pengawas', req.url));
    }
    
    if (pathname === '/') {
        if (role === 'ADMIN') return NextResponse.redirect(new URL('/admin', req.url));
        if (role === 'PENGAWAS') return NextResponse.redirect(new URL('/pengawas', req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/',
    }
  }
);

export const config = {
  matcher: ['/pengawas/:path*', '/admin/:path*', '/'],
};
