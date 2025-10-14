import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET - Listar usuarios
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo super_admin y admin pueden ver usuarios
    if (session.user.role !== 'super_admin' && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const busqueda = searchParams.get('busqueda')
    const role = searchParams.get('role')
    const activo = searchParams.get('activo')

    const where: any = {}

    if (busqueda) {
      where.OR = [
        { name: { contains: busqueda, mode: 'insensitive' } },
        { email: { contains: busqueda, mode: 'insensitive' } }
      ]
    }

    if (role) {
      where.role = role
    }

    if (activo !== null && activo !== undefined && activo !== '') {
      where.activo = activo === 'true'
    }

    const users = await prisma.users.findMany({
      where,
      orderBy: {
        created_at: 'desc'
      },
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

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error al obtener usuarios:', error)
    return NextResponse.json(
      { error: 'Error al obtener usuarios' },
      { status: 500 }
    )
  }
}

// POST - Crear usuario
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo super_admin y admin pueden crear usuarios
    if (session.user.role !== 'super_admin' && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 })
    }

    const body = await req.json()
    const { name, email, password, role, proyecto_asignado_id } = body

    // Validaciones
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Nombre, email, contraseña y rol son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el email no exista
    const existingUser = await prisma.users.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'El email ya está en uso' },
        { status: 400 }
      )
    }

    // Hash de contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    // Crear usuario con aprobado = true (usuarios creados por admin ya están aprobados)
    const user = await prisma.users.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        proyecto_asignado_id: proyecto_asignado_id || null,
        activo: true,
        aprobado: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        proyecto_asignado_id: true,
        activo: true,
        created_at: true
      }
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('Error al crear usuario:', error)
    return NextResponse.json(
      { error: 'Error al crear usuario' },
      { status: 500 }
    )
  }
}
