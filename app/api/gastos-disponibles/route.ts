import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET - Obtener gastos disponibles para vincular
export async function GET(req: NextRequest) {
  try {
    // Obtener todos los gastos con sus vinculaciones
    const gastos = await prisma.gastos.findMany({
      where: {
        deleted_at: null
      },
      include: {
        categorias_gasto: {
          select: {
            nombre: true
          }
        },
        gastos_avances_obra: {
          select: {
            monto_asignado: true
          }
        }
      },
      orderBy: {
        fecha: 'desc'
      }
    })

    // Calcular monto disponible para cada gasto
    const gastosConDisponible = gastos.map(gasto => {
      const montoTotal = Number(gasto.monto)
      const montoAsignado = gasto.gastos_avances_obra.reduce(
        (sum, gao) => sum + Number(gao.monto_asignado),
        0
      )
      const montoDisponible = montoTotal - montoAsignado

      return {
        id: gasto.id,
        descripcion: gasto.descripcion,
        monto: montoTotal,
        fecha: gasto.fecha,
        categorias_gasto: gasto.categorias_gasto,
        monto_disponible: montoDisponible
      }
    })

    // Filtrar solo los gastos que tienen monto disponible
    const gastosDisponibles = gastosConDisponible.filter(
      gasto => gasto.monto_disponible > 0
    )

    return NextResponse.json({
      gastos: gastosDisponibles
    })
  } catch (error) {
    console.error('Error al obtener gastos disponibles:', error)
    return NextResponse.json(
      { error: 'Error al obtener gastos disponibles' },
      { status: 500 }
    )
  }
}