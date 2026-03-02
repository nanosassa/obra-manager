# Sistema de Gestion de Obra - TODO

## Completado

### FASE 1: Setup Inicial
- [x] Crear proyecto Next.js
- [x] Configurar Prisma con introspección de BD existente
- [x] Instalar dependencias (Prisma, NextAuth, Recharts, jsPDF, Radix UI, etc.)
- [x] Crear estructura de carpetas
- [x] Configurar lib/prisma.ts, lib/utils.ts

### FASE 2: Dashboard
- [x] Layout del dashboard con sidebar responsive (hamburger menu en mobile)
- [x] Página principal con cards de estadísticas en tiempo real
- [x] Gráfico de gastos por categoría (Recharts)
- [x] Tabla de últimos gastos
- [x] Resumen de pagos por persona

### FASE 3: Gestión de Gastos
- [x] Lista de gastos con filtros avanzados (categoría, persona, estado, proveedor, fecha, monto)
- [x] Paginación (10 items por página)
- [x] Formulario nuevo gasto con creación inline de categorías/proveedores/personas/métodos de pago
- [x] Edición de gastos con editor de vinculaciones
- [x] Vista detalle de gasto con cards informativos y vinculaciones
- [x] Página de pagos pendientes con resumen por persona y alertas de vencimiento
- [x] Marcar gasto como pagado
- [x] Vinculación/desvinculación de gastos a avances con validación de presupuesto
- [x] API REST completa (CRUD + marcar-pagado + vincular/desvincular)
- [x] Exportar gastos a PDF

### FASE 4: Avances de Obra
- [x] Lista de avances con filtros (proveedor, búsqueda, presupuesto, % avance)
- [x] Barras de progreso con color-coding (verde completado, rojo sobre-presupuesto)
- [x] Formulario nuevo avance (descripción, proveedor, presupuesto, % progreso, notas)
- [x] Edición de avances
- [x] Vista detalle con info presupuestaria y gastos vinculados
- [x] API REST completa (CRUD)
- [x] Exportar avances a PDF

### FASE 5: Reportes (parcial)
- [x] Dashboard de reportes con resumen ejecutivo y 4 stat cards
- [x] Alerta de presupuesto cuando el gasto supera el 90%
- [x] Reporte detallado por categoría con desglose, tablas y exportación PDF
- [x] Gráficos interactivos con Recharts
- [x] Exportar a PDF (gastos y avances)

### FASE 6: Autenticación y Usuarios
- [x] Login con credenciales (email/password)
- [x] Login con Google OAuth
- [x] Registro de usuarios con workflow de aprobación
- [x] Middleware de protección de rutas (dashboard y API)
- [x] Sistema de roles (super_admin, admin, project_manager, contador, viewer)
- [x] Permisos granulares por rol (lib/permissions.ts)
- [x] CRUD completo de usuarios (lista, crear, ver, editar, eliminar)
- [x] Aprobar/rechazar usuarios pendientes
- [x] Perfil de usuario (editar datos, cambiar contraseña)
- [x] Hook usePermissions para control en frontend

### FASE 7: Deploy e Infraestructura
- [x] Dockerfile
- [x] docker-compose.yml (desarrollo local con PostgreSQL)
- [x] GitHub Actions workflow para deploy automático a EasyPanel
- [x] Responsive design (sidebar desktop + hamburger mobile)
- [x] Scripts de administración (create-admin, approve-users, update-admin-role)

---

## Pendiente

### Reportes adicionales
- [ ] Reporte por proveedor (página dedicada)
- [ ] Reporte por persona (página dedicada)
- [ ] Reporte de tendencias y proyecciones
- [ ] Exportar a Excel

### Configuración - ABM de maestros (páginas dedicadas)
- [ ] CRUD Proveedores (página `proveedores/` es stub, API GET/POST existe)
- [ ] CRUD Personas (página `personas/` es stub, API GET/POST existe)
- [ ] CRUD Categorías (API GET/POST existe, falta página dedicada)
- [ ] CRUD Métodos de Pago (API GET/POST existe, falta página dedicada)
- [ ] Página de configuración general (actualmente stub "en desarrollo")

### Mejoras
- [ ] Loading states mejorados
- [ ] Error handling mejorado
- [ ] Completar API de maestros con PUT/DELETE

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19, Next.js 15.5, TailwindCSS 4 |
| Backend | Next.js API Routes (App Router) |
| Base de datos | PostgreSQL + Prisma ORM 6 |
| Autenticación | NextAuth.js (Google OAuth + Credentials) |
| Gráficos | Recharts |
| PDF | jsPDF + jspdf-autotable |
| Iconos | Lucide React |
| Deploy | Docker + GitHub Actions + EasyPanel |
