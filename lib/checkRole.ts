import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { UserRole, canCreate, canEdit, canDelete, isViewer } from '@/lib/permissions'

/**
 * Obtiene la sesión del usuario actual
 */
export async function getSession() {
  const session = await getServerSession(authOptions)
  return session
}

/**
 * Verifica si el usuario está autenticado
 * Retorna NextResponse de error si no está autenticado
 */
export async function requireAuth() {
  const session = await getSession()

  if (!session?.user?.id) {
    return {
      error: NextResponse.json(
        { error: 'No autenticado. Por favor inicia sesión.' },
        { status: 401 }
      ),
      session: null
    }
  }

  return { error: null, session }
}

/**
 * Verifica si el usuario puede crear recursos
 * Bloquea a viewers y contadores
 */
export async function requireCreatePermission() {
  const { error, session } = await requireAuth()
  if (error) return { error, session: null }

  const role = session?.user?.role as UserRole

  if (!canCreate(role)) {
    return {
      error: NextResponse.json(
        { error: 'No tienes permisos para crear recursos. Tu rol es de solo lectura.' },
        { status: 403 }
      ),
      session: null
    }
  }

  return { error: null, session }
}

/**
 * Verifica si el usuario puede editar recursos
 * Bloquea solo a viewers
 */
export async function requireEditPermission() {
  const { error, session } = await requireAuth()
  if (error) return { error, session: null }

  const role = session?.user?.role as UserRole

  if (!canEdit(role)) {
    return {
      error: NextResponse.json(
        { error: 'No tienes permisos para editar recursos. Tu rol es de solo lectura.' },
        { status: 403 }
      ),
      session: null
    }
  }

  return { error: null, session }
}

/**
 * Verifica si el usuario puede eliminar recursos
 * Solo admin y super_admin pueden eliminar
 */
export async function requireDeletePermission() {
  const { error, session } = await requireAuth()
  if (error) return { error, session: null }

  const role = session?.user?.role as UserRole

  if (!canDelete(role)) {
    return {
      error: NextResponse.json(
        { error: 'No tienes permisos para eliminar recursos. Solo administradores pueden hacerlo.' },
        { status: 403 }
      ),
      session: null
    }
  }

  return { error: null, session }
}

/**
 * Bloquea el acceso a viewers
 * Útil para proteger operaciones de escritura
 */
export async function blockViewers() {
  const { error, session } = await requireAuth()
  if (error) return { error, session: null }

  const role = session?.user?.role as UserRole

  if (isViewer(role)) {
    return {
      error: NextResponse.json(
        { error: 'Acceso denegado. Los usuarios con rol "Viewer" no pueden realizar esta acción.' },
        { status: 403 }
      ),
      session: null
    }
  }

  return { error: null, session }
}

/**
 * Verifica si el usuario es admin o super_admin
 */
export async function requireAdminPermission() {
  const { error, session } = await requireAuth()
  if (error) return { error, session: null }

  const role = session?.user?.role as UserRole

  if (role !== 'admin' && role !== 'super_admin') {
    return {
      error: NextResponse.json(
        { error: 'Acceso denegado. Solo administradores pueden realizar esta acción.' },
        { status: 403 }
      ),
      session: null
    }
  }

  return { error: null, session }
}
