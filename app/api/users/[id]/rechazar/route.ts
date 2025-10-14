import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// POST - Rechazar usuario (eliminar)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo super_admin y admin pueden rechazar usuarios
    if (session.user.role !== 'super_admin' && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 })
    }

    const { id: userId } = await params

    // Eliminar usuario (hard delete porque nunca fue aprobado)
    await prisma.users.delete({
      where: { id: userId }
    })

    return NextResponse.json({
      message: 'Usuario rechazado y eliminado exitosamente'
    })
  } catch (error) {
    console.error('Error al rechazar usuario:', error)
    return NextResponse.json(
      { error: 'Error al rechazar usuario' },
      { status: 500 }
    )
  }
}
