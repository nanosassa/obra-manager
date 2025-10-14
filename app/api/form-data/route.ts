import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    // Obtener proyecto principal
    const proyecto = await prisma.proyectos_obra.findFirst({
      where: {
        nombre: "Habitacion Nuestra",
        deleted_at: null
      }
    })

    // Obtener datos para los selects
    const [categorias, personas, proveedores, estados, metodos, avances] = await Promise.all([
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
      }),
      proyecto ? prisma.avances_obra.findMany({
        where: {
          proyecto_obra_id: proyecto.id,
          deleted_at: null
        },
        select: {
          id: true,
          descripcion: true,
          monto_presupuestado: true
        },
        orderBy: { created_at: 'desc' }
      }) : []
    ])

    // Convertir Decimals de avances
    const avancesSerializados = avances.map(a => ({
      id: a.id,
      descripcion: a.descripcion,
      monto_presupuestado: a.monto_presupuestado ? Number(a.monto_presupuestado) : null
    }))

    return NextResponse.json({
      categorias,
      personas,
      proveedores,
      estados,
      metodos,
      avances: avancesSerializados
    })

  } catch (error) {
    console.error('Error al obtener datos del formulario:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}