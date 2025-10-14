import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// POST - Aprobar usuario
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo super_admin y admin pueden aprobar usuarios
    if (session.user.role !== 'super_admin' && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 })
    }

    const { id: userId } = await params

    // Aprobar usuario
    const user = await prisma.users.update({
      where: { id: userId },
      data: {
        aprobado: true,
        updated_at: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })

    return NextResponse.json({
      message: 'Usuario aprobado exitosamente',
      user
    })
  } catch (error) {
    console.error('Error al aprobar usuario:', error)
    return NextResponse.json(
      { error: 'Error al aprobar usuario' },
      { status: 500 }
    )
  }
}
