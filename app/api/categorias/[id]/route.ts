import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const categoria = await prisma.categorias_gasto.findFirst({
      where: { id, deleted_at: null }
    })

    if (!categoria) {
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(categoria)
  } catch (error) {
    console.error('Error al obtener categoría:', error)
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

    const existente = await prisma.categorias_gasto.findFirst({
      where: { id, deleted_at: null }
    })

    if (!existente) {
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 404 }
      )
    }

    const duplicado = await prisma.categorias_gasto.findFirst({
      where: {
        nombre: nombre.trim(),
        deleted_at: null,
        NOT: { id }
      }
    })

    if (duplicado) {
      return NextResponse.json(
        { error: 'Ya existe una categoría con ese nombre' },
        { status: 400 }
      )
    }

    const categoria = await prisma.categorias_gasto.update({
      where: { id },
      data: {
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        activo: activo ?? true,
        updated_at: new Date()
      }
    })

    return NextResponse.json(categoria)
  } catch (error) {
    console.error('Error al actualizar categoría:', error)
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

    const existente = await prisma.categorias_gasto.findFirst({
      where: { id, deleted_at: null }
    })

    if (!existente) {
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 404 }
      )
    }

    await prisma.categorias_gasto.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        activo: false,
        updated_at: new Date()
      }
    })

    return NextResponse.json({ message: 'Categoría eliminada exitosamente' })
  } catch (error) {
    console.error('Error al eliminar categoría:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
