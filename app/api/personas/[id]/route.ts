import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const persona = await prisma.personas.findFirst({
      where: { id, deleted_at: null }
    })

    if (!persona) {
      return NextResponse.json(
        { error: 'Persona no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(persona)
  } catch (error) {
    console.error('Error al obtener persona:', error)
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
    const { nombre, apellido, email, telefono, activo } = body

    if (!nombre?.trim()) {
      return NextResponse.json(
        { error: 'El nombre es obligatorio' },
        { status: 400 }
      )
    }

    const existente = await prisma.personas.findFirst({
      where: { id, deleted_at: null }
    })

    if (!existente) {
      return NextResponse.json(
        { error: 'Persona no encontrada' },
        { status: 404 }
      )
    }

    // Verificar nombre duplicado
    const duplicado = await prisma.personas.findFirst({
      where: {
        nombre: nombre.trim(),
        deleted_at: null,
        NOT: { id }
      }
    })

    if (duplicado) {
      return NextResponse.json(
        { error: 'Ya existe una persona con ese nombre' },
        { status: 400 }
      )
    }

    const persona = await prisma.personas.update({
      where: { id },
      data: {
        nombre: nombre.trim(),
        apellido: apellido?.trim() || null,
        email: email?.trim() || null,
        telefono: telefono?.trim() || null,
        activo: activo ?? true,
        updated_at: new Date()
      }
    })

    return NextResponse.json(persona)
  } catch (error) {
    console.error('Error al actualizar persona:', error)
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

    const existente = await prisma.personas.findFirst({
      where: { id, deleted_at: null }
    })

    if (!existente) {
      return NextResponse.json(
        { error: 'Persona no encontrada' },
        { status: 404 }
      )
    }

    await prisma.personas.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        activo: false,
        updated_at: new Date()
      }
    })

    return NextResponse.json({ message: 'Persona eliminada exitosamente' })
  } catch (error) {
    console.error('Error al eliminar persona:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
