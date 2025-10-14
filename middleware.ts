export { default } from "next-auth/middleware"

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
