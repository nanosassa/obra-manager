// Sistema de permisos por rol

export type UserRole = 'super_admin' | 'admin' | 'project_manager' | 'contador' | 'viewer'

export type Permission =
  // Gastos
  | 'gastos:create'
  | 'gastos:read'
  | 'gastos:update'
  | 'gastos:delete'
  | 'gastos:export'

  // Avances
  | 'avances:create'
  | 'avances:read'
  | 'avances:update'
  | 'avances:delete'
  | 'avances:export'

  // Proveedores
  | 'proveedores:create'
  | 'proveedores:read'
  | 'proveedores:update'
  | 'proveedores:delete'

  // Personas
  | 'personas:create'
  | 'personas:read'
  | 'personas:update'
  | 'personas:delete'

  // Usuarios
  | 'usuarios:create'
  | 'usuarios:read'
  | 'usuarios:update'
  | 'usuarios:delete'
  | 'usuarios:approve'

  // Reportes
  | 'reportes:read'
  | 'reportes:export'

  // Configuración
  | 'configuracion:update'

// Definición de permisos por rol
export const rolePermissions: Record<UserRole, Permission[]> = {
  super_admin: [
    // Todos los permisos
    'gastos:create', 'gastos:read', 'gastos:update', 'gastos:delete', 'gastos:export',
    'avances:create', 'avances:read', 'avances:update', 'avances:delete', 'avances:export',
    'proveedores:create', 'proveedores:read', 'proveedores:update', 'proveedores:delete',
    'personas:create', 'personas:read', 'personas:update', 'personas:delete',
    'usuarios:create', 'usuarios:read', 'usuarios:update', 'usuarios:delete', 'usuarios:approve',
    'reportes:read', 'reportes:export',
    'configuracion:update',
  ],

  admin: [
    // Casi todos los permisos (excepto modificar super_admins)
    'gastos:create', 'gastos:read', 'gastos:update', 'gastos:delete', 'gastos:export',
    'avances:create', 'avances:read', 'avances:update', 'avances:delete', 'avances:export',
    'proveedores:create', 'proveedores:read', 'proveedores:update', 'proveedores:delete',
    'personas:create', 'personas:read', 'personas:update', 'personas:delete',
    'usuarios:create', 'usuarios:read', 'usuarios:update', 'usuarios:delete', 'usuarios:approve',
    'reportes:read', 'reportes:export',
    'configuracion:update',
  ],

  project_manager: [
    // Gestión de su proyecto
    'gastos:create', 'gastos:read', 'gastos:update', 'gastos:export',
    'avances:create', 'avances:read', 'avances:update', 'avances:export',
    'proveedores:read',
    'personas:read',
    'reportes:read', 'reportes:export',
  ],

  contador: [
    // Solo lectura + cambiar estados de pago + exportar
    'gastos:read', 'gastos:update', 'gastos:export', // update solo para estados de pago
    'avances:read', 'avances:export',
    'proveedores:read',
    'personas:read',
    'reportes:read', 'reportes:export',
  ],

  viewer: [
    // SOLO LECTURA - Sin permisos de escritura ni exportación
    'gastos:read',
    'avances:read',
    'proveedores:read',
    'personas:read',
    'reportes:read',
  ],
}

/**
 * Verifica si un rol tiene un permiso específico
 */
export function hasPermission(role: UserRole | undefined, permission: Permission): boolean {
  if (!role) return false
  return rolePermissions[role]?.includes(permission) || false
}

/**
 * Verifica si un rol puede crear recursos
 */
export function canCreate(role: UserRole | undefined): boolean {
  if (!role) return false
  return role !== 'viewer' && role !== 'contador'
}

/**
 * Verifica si un rol puede editar recursos
 */
export function canEdit(role: UserRole | undefined): boolean {
  if (!role) return false
  return role !== 'viewer'
}

/**
 * Verifica si un rol puede eliminar recursos
 */
export function canDelete(role: UserRole | undefined): boolean {
  if (!role) return false
  return role === 'super_admin' || role === 'admin'
}

/**
 * Verifica si un rol puede exportar
 */
export function canExport(role: UserRole | undefined): boolean {
  if (!role) return false
  return role !== 'viewer'
}

/**
 * Verifica si un usuario es viewer (solo lectura)
 */
export function isViewer(role: UserRole | undefined): boolean {
  return role === 'viewer'
}

/**
 * Verifica si un usuario es admin o super_admin
 */
export function isAdmin(role: UserRole | undefined): boolean {
  return role === 'admin' || role === 'super_admin'
}

/**
 * Verifica si un usuario es super_admin
 */
export function isSuperAdmin(role: UserRole | undefined): boolean {
  return role === 'super_admin'
}
