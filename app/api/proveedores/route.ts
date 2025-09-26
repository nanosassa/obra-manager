import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const proveedores = await prisma.proveedores.findMany({
      where: {
        deleted_at: null
      },
      orderBy: {
        nombre: 'asc'
      }
    })

    return NextResponse.json(proveedores)
  } catch (error) {
    console.error('Error al obtener proveedores:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { nombre } = await request.json()

    if (!nombre?.trim()) {
      return NextResponse.json(
        { error: 'El nombre es obligatorio' },
        { status: 400 }
      )
    }

    // Verificar si ya existe un proveedor con ese nombre
    const proveedorExistente = await prisma.proveedores.findFirst({
      where: {
        nombre: nombre.trim(),
        deleted_at: null
      }
    })

    if (proveedorExistente) {
      return NextResponse.json(
        { error: 'Ya existe un proveedor con ese nombre' },
        { status: 400 }
      )
    }

    const nuevoProveedor = await prisma.proveedores.create({
      data: {
        nombre: nombre.trim(),
        activo: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    })

    return NextResponse.json(nuevoProveedor, { status: 201 })
  } catch (error) {
    console.error('Error al crear proveedor:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}