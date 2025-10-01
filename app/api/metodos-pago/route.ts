import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const metodos = await prisma.metodos_pago.findMany({
      where: {
        deleted_at: null
      },
      orderBy: {
        nombre: 'asc'
      }
    })

    return NextResponse.json(metodos)
  } catch (error) {
    console.error('Error al obtener métodos de pago:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { nombre, descripcion } = await request.json()

    if (!nombre?.trim()) {
      return NextResponse.json(
        { error: 'El nombre es obligatorio' },
        { status: 400 }
      )
    }

    // Verificar si ya existe un método con ese nombre
    const metodoExistente = await prisma.metodos_pago.findFirst({
      where: {
        nombre: nombre.trim(),
        deleted_at: null
      }
    })

    if (metodoExistente) {
      return NextResponse.json(
        { error: 'Ya existe un método de pago con ese nombre' },
        { status: 400 }
      )
    }

    const nuevoMetodo = await prisma.metodos_pago.create({
      data: {
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        activo: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    })

    return NextResponse.json(nuevoMetodo, { status: 201 })
  } catch (error) {
    console.error('Error al crear método de pago:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}