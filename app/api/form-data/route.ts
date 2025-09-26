import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    // Obtener datos para los selects
    const [categorias, personas, proveedores, estados, metodos] = await Promise.all([
      prisma.categorias_gasto.findMany({
        where: { deleted_at: null, activo: true },
        orderBy: { nombre: 'asc' }
      }),
      prisma.personas.findMany({
        where: { deleted_at: null, activo: true },
        orderBy: { nombre: 'asc' }
      }),
      prisma.proveedores.findMany({
        where: { deleted_at: null, activo: true },
        orderBy: { nombre: 'asc' }
      }),
      prisma.estados_pago.findMany({
        where: { deleted_at: null, activo: true },
        orderBy: { nombre: 'asc' }
      }),
      prisma.metodos_pago.findMany({
        where: { deleted_at: null, activo: true },
        orderBy: { nombre: 'asc' }
      })
    ])

    return NextResponse.json({
      categorias,
      personas,
      proveedores,
      estados,
      metodos
    })

  } catch (error) {
    console.error('Error al obtener datos del formulario:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}