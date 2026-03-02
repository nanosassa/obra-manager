import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const metodo = await prisma.metodos_pago.findFirst({
      where: { id, deleted_at: null }
    })

    if (!metodo) {
      return NextResponse.json(
        { error: 'Método de pago no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(metodo)
  } catch (error) {
    console.error('Error al obtener método de pago:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { nombre, descripcion, activo } = body

    if (!nombre?.trim()) {
      return NextResponse.json(
        { error: 'El nombre es obligatorio' },
        { status: 400 }
      )
    }

    const existente = await prisma.metodos_pago.findFirst({
      where: { id, deleted_at: null }
    })

    if (!existente) {
      return NextResponse.json(
        { error: 'Método de pago no encontrado' },
        { status: 404 }
      )
    }

    const duplicado = await prisma.metodos_pago.findFirst({
      where: {
        nombre: nombre.trim(),
        deleted_at: null,
        NOT: { id }
      }
    })

    if (duplicado) {
      return NextResponse.json(
        { error: 'Ya existe un método de pago con ese nombre' },
        { status: 400 }
      )
    }

    const metodo = await prisma.metodos_pago.update({
      where: { id },
      data: {
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        activo: activo ?? true,
        updated_at: new Date()
      }
    })

    return NextResponse.json(metodo)
  } catch (error) {
    console.error('Error al actualizar método de pago:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existente = await prisma.metodos_pago.findFirst({
      where: { id, deleted_at: null }
    })

    if (!existente) {
      return NextResponse.json(
        { error: 'Método de pago no encontrado' },
        { status: 404 }
      )
    }

    await prisma.metodos_pago.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        activo: false,
        updated_at: new Date()
      }
    })

    return NextResponse.json({ message: 'Método de pago eliminado exitosamente' })
  } catch (error) {
    console.error('Error al eliminar método de pago:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
