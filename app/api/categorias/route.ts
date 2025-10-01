import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const categorias = await prisma.categorias_gasto.findMany({
      where: {
        deleted_at: null
      },
      orderBy: {
        nombre: 'asc'
      }
    })

    return NextResponse.json(categorias)
  } catch (error) {
    console.error('Error al obtener categorías:', error)
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

    // Verificar si ya existe una categoría con ese nombre
    const categoriaExistente = await prisma.categorias_gasto.findFirst({
      where: {
        nombre: nombre.trim(),
        deleted_at: null
      }
    })

    if (categoriaExistente) {
      return NextResponse.json(
        { error: 'Ya existe una categoría con ese nombre' },
        { status: 400 }
      )
    }

    const nuevaCategoria = await prisma.categorias_gasto.create({
      data: {
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        activo: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    })

    return NextResponse.json(nuevaCategoria, { status: 201 })
  } catch (error) {
    console.error('Error al crear categoría:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}