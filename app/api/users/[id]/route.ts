import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET - Obtener un usuario específico
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id: userId } = await params

    // Solo super_admin, admin, o el propio usuario pueden ver el perfil
    if (
      session.user.role !== 'super_admin' &&
      session.user.role !== 'admin' &&
      session.user.id !== userId
    ) {
      return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 })
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        oauth_provider: true,
        avatar_url: true,
        proyecto_asignado_id: true,
        activo: true,
        created_at: true,
        updated_at: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error al obtener usuario:', error)
    return NextResponse.json(
      { error: 'Error al obtener usuario' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar usuario
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id: userId } = await params
    const body = await req.json()
    const { name, email, role, proyecto_asignado_id, activo, password } = body

    // Solo super_admin puede editar usuarios (excepto su propio perfil)
    if (session.user.role !== 'super_admin' && session.user.id !== userId) {
      return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 })
    }

    // Verificar que el usuario existe
    const existingUser = await prisma.users.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Si se está cambiando el email, verificar que no exista
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.users.findUnique({
        where: { email }
      })

      if (emailExists) {
        return NextResponse.json(
          { error: 'El email ya está en uso' },
          { status: 400 }
        )
      }
    }

    const updateData: any = {}

    if (name) updateData.name = name
    if (email) updateData.email = email

    // Solo super_admin puede cambiar rol y estado
    if (session.user.role === 'super_admin') {
      if (role) updateData.role = role
      if (activo !== undefined) updateData.activo = activo
      if (proyecto_asignado_id !== undefined) {
        updateData.proyecto_asignado_id = proyecto_asignado_id || null
      }
    }

    // Si se incluye password, hashearlo
    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    updateData.updated_at = new Date()

    const user = await prisma.users.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        proyecto_asignado_id: true,
        activo: true,
        updated_at: true
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error al actualizar usuario:', error)
    return NextResponse.json(
      { error: 'Error al actualizar usuario' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar usuario (soft delete)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo super_admin puede eliminar usuarios
    if (session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 })
    }

    const { id: userId } = await params

    // No permitir que el usuario se elimine a sí mismo
    if (session.user.id === userId) {
      return NextResponse.json(
        { error: 'No puedes eliminar tu propio usuario' },
        { status: 400 }
      )
    }

    // Soft delete - marcar como inactivo
    await prisma.users.update({
      where: { id: userId },
      data: {
        activo: false,
        updated_at: new Date()
      }
    })

    return NextResponse.json({ message: 'Usuario eliminado exitosamente' })
  } catch (error) {
    console.error('Error al eliminar usuario:', error)
    return NextResponse.json(
      { error: 'Error al eliminar usuario' },
      { status: 500 }
    )
  }
}
