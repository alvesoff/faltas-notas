import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Log para debug
  console.log(`[MIDDLEWARE] ${request.method} ${request.url}`);
  
  // Permitir todos os métodos para APIs
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const response = NextResponse.next();
    
    // Headers CORS se necessário
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
  ],
};