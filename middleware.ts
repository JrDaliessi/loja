import { createMiddlewareClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res: response })

  const { data: { session } } = await supabase.auth.getSession()

  // Protect /meus-pedidos route
  if (request.nextUrl.pathname.startsWith('/meus-pedidos') && !session) {
    return NextResponse.redirect(new URL('/conta/login', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)', // Match all paths except API routes, static files, and favicon
  ],
}
