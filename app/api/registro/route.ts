import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// POST - Registro público de usuarios
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password } = body

    // Validaciones
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nombre, email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Verificar que el email no exista
    const existingUser = await prisma.users.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 400 }
      )
    }

    // Hash de contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    // Crear usuario como viewer, activo pero NO aprobado
    const user = await prisma.users.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'viewer',
        activo: true,
        aprobado: false
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })

    return NextResponse.json({
      message: 'Usuario registrado exitosamente. Pendiente de aprobación.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error al registrar usuario:', error)

    return NextResponse.json(
      { error: 'Error al registrar usuario' },
      { status: 500 }
    )
  }
}
