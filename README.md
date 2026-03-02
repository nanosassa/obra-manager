# Sistema de Gestion de Obra

Aplicación web para la gestión integral de obras de construcción: control de gastos, seguimiento de avances, reportes y administración de usuarios con roles.

## Funcionalidades

- **Dashboard** con estadísticas en tiempo real, gráficos y resúmenes
- **Gestión de Gastos** - CRUD completo, filtros avanzados, paginación, vinculación a avances, exportación PDF
- **Avances de Obra** - Seguimiento de progreso con presupuesto vs ejecución real
- **Pagos Pendientes** - Vista dedicada con alertas de vencimiento y resumen por persona
- **Reportes** - Por categoría, resumen ejecutivo, gráficos interactivos
- **Usuarios y Roles** - 5 niveles (super_admin, admin, project_manager, contador, viewer) con permisos granulares
- **Autenticación** - Login con credenciales o Google OAuth, registro con aprobación

## Stack

- **Frontend**: React 19 + Next.js 15.5 + TailwindCSS 4
- **Backend**: Next.js API Routes (App Router)
- **BD**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js
- **Charts**: Recharts
- **PDF**: jsPDF
- **Deploy**: Docker + GitHub Actions + EasyPanel

## Desarrollo local

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con DATABASE_URL, NEXTAUTH_SECRET, etc.

# Generar cliente Prisma
npx prisma generate

# Ejecutar servidor de desarrollo
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

### Con Docker

```bash
docker-compose up
```

## Scripts útiles

```bash
npm run dev            # Servidor de desarrollo (Turbopack)
npm run build          # Build de producción
npm run type-check     # Verificación de tipos TypeScript
npm run create-admin   # Crear usuario super_admin
```

## Deploy

El deploy a EasyPanel se ejecuta automáticamente via GitHub Actions al pushear a `main`/`master`.
