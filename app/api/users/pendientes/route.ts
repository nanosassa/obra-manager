import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - Listar usuarios pendientes de aprobación
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo super_admin y admin pueden ver usuarios pendientes
    if (session.user.role !== 'super_admin' && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 })
    }

    // Obtener usuarios con aprobado = false
    const usuarios = await prisma.users.findMany({
      where: {
        aprobado: false,
        activo: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    return NextResponse.json(usuarios)
  } catch (error) {
    console.error('Error al obtener usuarios pendientes:', error)
    return NextResponse.json(
      { error: 'Error al obtener usuarios pendientes' },
      { status: 500 }
    )
  }
}
