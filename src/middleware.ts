import { NextResponse } from 'next/server';

export function middleware() {
  // In Next.js middleware, Firebase Client Auth state isn't directly available.
  // A robust implementation uses cookies (e.g. firebase-admin session cookies) 
  // For Phase 2 prototype, we will allow client-side AuthProvider to handle redirects
  // as setting up Next.js Edge Firebase Auth requires a complex session cookie architecture.
  
  return NextResponse.next();
}

// See AuthProvider for the actual client-side protection mechanism used in Phase 2
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
