import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const proveedor = await prisma.proveedores.findFirst({
      where: { id, deleted_at: null }
    })

    if (!proveedor) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(proveedor)
  } catch (error) {
    console.error('Error al obtener proveedor:', error)
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
    const { nombre, razon_social, cuit, direccion, telefono, email, contacto_nombre, activo } = body

    if (!nombre?.trim()) {
      return NextResponse.json(
        { error: 'El nombre es obligatorio' },
        { status: 400 }
      )
    }

    // Verificar que existe
    const existente = await prisma.proveedores.findFirst({
      where: { id, deleted_at: null }
    })

    if (!existente) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      )
    }

    // Verificar nombre duplicado
    const duplicado = await prisma.proveedores.findFirst({
      where: {
        nombre: nombre.trim(),
        deleted_at: null,
        NOT: { id }
      }
    })

    if (duplicado) {
      return NextResponse.json(
        { error: 'Ya existe un proveedor con ese nombre' },
        { status: 400 }
      )
    }

    const proveedor = await prisma.proveedores.update({
      where: { id },
      data: {
        nombre: nombre.trim(),
        razon_social: razon_social?.trim() || null,
        cuit: cuit?.trim() || null,
        direccion: direccion?.trim() || null,
        telefono: telefono?.trim() || null,
        email: email?.trim() || null,
        contacto_nombre: contacto_nombre?.trim() || null,
        activo: activo ?? true,
        updated_at: new Date()
      }
    })

    return NextResponse.json(proveedor)
  } catch (error) {
    console.error('Error al actualizar proveedor:', error)
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

    const existente = await prisma.proveedores.findFirst({
      where: { id, deleted_at: null }
    })

    if (!existente) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      )
    }

    // Soft delete
    await prisma.proveedores.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        activo: false,
        updated_at: new Date()
      }
    })

    return NextResponse.json({ message: 'Proveedor eliminado exitosamente' })
  } catch (error) {
    console.error('Error al eliminar proveedor:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
