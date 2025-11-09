import { useSession } from 'next-auth/react'
import {
  UserRole,
  Permission,
  hasPermission,
  canCreate,
  canEdit,
  canDelete,
  canExport,
  isViewer,
  isAdmin,
  isSuperAdmin
} from '@/lib/permissions'

/**
 * Hook para verificar permisos en componentes cliente
 * Usa la sesión de NextAuth para obtener el rol del usuario
 */
export function usePermissions() {
  const { data: session } = useSession()
  const role = session?.user?.role as UserRole | undefined

  return {
    // Rol del usuario
    role,

    // Verificaciones de permisos específicos
    hasPermission: (permission: Permission) => hasPermission(role, permission),

    // Verificaciones de permisos generales
    canCreate: canCreate(role),
    canEdit: canEdit(role),
    canDelete: canDelete(role),
    canExport: canExport(role),

    // Verificaciones de rol
    isViewer: isViewer(role),
    isAdmin: isAdmin(role),
    isSuperAdmin: isSuperAdmin(role),

    // Permisos específicos por recurso
    permissions: {
      gastos: {
        create: hasPermission(role, 'gastos:create'),
        read: hasPermission(role, 'gastos:read'),
        update: hasPermission(role, 'gastos:update'),
        delete: hasPermission(role, 'gastos:delete'),
        export: hasPermission(role, 'gastos:export'),
      },
      avances: {
        create: hasPermission(role, 'avances:create'),
        read: hasPermission(role, 'avances:read'),
        update: hasPermission(role, 'avances:update'),
        delete: hasPermission(role, 'avances:delete'),
        export: hasPermission(role, 'avances:export'),
      },
      proveedores: {
        create: hasPermission(role, 'proveedores:create'),
        read: hasPermission(role, 'proveedores:read'),
        update: hasPermission(role, 'proveedores:update'),
        delete: hasPermission(role, 'proveedores:delete'),
      },
      personas: {
        create: hasPermission(role, 'personas:create'),
        read: hasPermission(role, 'personas:read'),
        update: hasPermission(role, 'personas:update'),
        delete: hasPermission(role, 'personas:delete'),
      },
      usuarios: {
        create: hasPermission(role, 'usuarios:create'),
        read: hasPermission(role, 'usuarios:read'),
        update: hasPermission(role, 'usuarios:update'),
        delete: hasPermission(role, 'usuarios:delete'),
        approve: hasPermission(role, 'usuarios:approve'),
      },
      reportes: {
        read: hasPermission(role, 'reportes:read'),
        export: hasPermission(role, 'reportes:export'),
      },
      configuracion: {
        update: hasPermission(role, 'configuracion:update'),
      },
    },
  }
}
