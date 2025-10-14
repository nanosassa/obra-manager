import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
    pages: {
      signIn: '/login',
    }
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/gastos/:path*',
    '/api/avances/:path*',
    '/api/proveedores/:path*',
    '/api/categorias/:path*',
    '/api/personas/:path*',
    '/api/metodos-pago/:path*',
    '/api/form-data/:path*',
    '/api/users/:path*',
    '/api/proyectos/:path*',
  ]
}
