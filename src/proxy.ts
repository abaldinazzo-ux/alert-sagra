import { NextRequest, NextResponse } from 'next/server'

export function proxy(_req: NextRequest) {
  return NextResponse.next()
}

export const config = {
  /*
   * Esclude dal proxy:
   * - _next/static  — asset statici del bundle
   * - _next/image   — image optimization pipeline
   * - favicon.ico   — icona browser
   * - api/          — route API (non passano per il proxy edge)
   *
   * Le route /admin, /distribuzione, /cucina/interna, /cucina/esterna
   * vengono attraversate e restituite con NextResponse.next() senza blocchi.
   */
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|api/).*)'],
}
