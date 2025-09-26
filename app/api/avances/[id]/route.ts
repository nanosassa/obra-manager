import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET - Obtener un avance específico
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: avanceId } = await params

    const avance = await prisma.avances_obra.findFirst({
      where: {
        id: avanceId,
        deleted_at: null
      },
      include: {
        gastos_avances_obra: {
          include: {
            gastos: {
              select: {
                id: true,
                descripcion: true,
                monto: true,
                fecha: true
              }
            }
          }
        }
      }
    })

    if (!avance) {
      return NextResponse.json(
        { error: 'Avance no encontrado' },
        { status: 404 }
      )
    }

    // Calcular totales
    const totalGastado = avance.gastos_avances_obra.reduce(
      (sum, gao) => sum + Number(gao.monto_asignado),
      0
    )

    const presupuesto = Number(avance.monto_presupuestado) || 0
    const porcentajeGastado = presupuesto > 0
      ? (totalGastado / presupuesto) * 100
      : 0

    const avanceConProgreso = {
      ...avance,
      monto_presupuestado: presupuesto,
      porcentaje_avance: Number(avance.porcentaje_avance) || 0,
      total_gastado: totalGastado,
      porcentaje_gastado: porcentajeGastado,
      gastos_count: avance.gastos_avances_obra.length
    }

    return NextResponse.json(avanceConProgreso)
  } catch (error) {
    console.error('Error al obtener avance:', error)
    return NextResponse.json(
      { error: 'Error al obtener avance' },
      { status: 500 }
    )
  }
}