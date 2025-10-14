import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - Listar proyectos
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const proyectos = await prisma.proyectos_obra.findMany({
      where: {
        activo: true,
        deleted_at: null
      },
      select: {
        id: true,
        nombre: true,
        descripcion: true
      },
      orderBy: {
        nombre: 'asc'
      }
    })

    return NextResponse.json(proyectos)
  } catch (error) {
    console.error('Error al obtener proyectos:', error)
    return NextResponse.json(
      { error: 'Error al obtener proyectos' },
      { status: 500 }
    )
  }
}
