import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const personas = await prisma.personas.findMany({
      where: {
        deleted_at: null
      },
      orderBy: {
        nombre: 'asc'
      }
    })

    return NextResponse.json(personas)
  } catch (error) {
    console.error('Error al obtener personas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { nombre, telefono, email } = await request.json()

    if (!nombre?.trim()) {
      return NextResponse.json(
        { error: 'El nombre es obligatorio' },
        { status: 400 }
      )
    }

    // Verificar si ya existe una persona con ese nombre
    const personaExistente = await prisma.personas.findFirst({
      where: {
        nombre: nombre.trim(),
        deleted_at: null
      }
    })

    if (personaExistente) {
      return NextResponse.json(
        { error: 'Ya existe una persona con ese nombre' },
        { status: 400 }
      )
    }

    const nuevaPersona = await prisma.personas.create({
      data: {
        nombre: nombre.trim(),
        telefono: telefono?.trim() || null,
        email: email?.trim() || null,
        activo: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    })

    return NextResponse.json(nuevaPersona, { status: 201 })
  } catch (error) {
    console.error('Error al crear persona:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}