import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// POST - Vincular un gasto a un avance de obra
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { gasto_id, avance_obra_id, monto_asignado, notas } = body

    // Validar campos requeridos
    if (!gasto_id || !avance_obra_id || !monto_asignado) {
      return NextResponse.json(
        { error: 'Gasto, avance y monto son requeridos' },
        { status: 400 }
      )
    }

    const montoAsignado = parseFloat(monto_asignado)
    if (montoAsignado <= 0) {
      return NextResponse.json(
        { error: 'El monto debe ser mayor a 0' },
        { status: 400 }
      )
    }

    // Usar transacción para validar y crear la vinculación
    const result = await prisma.$transaction(async (tx) => {
      // Verificar que el gasto existe
      const gasto = await tx.gastos.findFirst({
        where: {
          id: gasto_id,
          deleted_at: null
        },
        include: {
          gastos_avances_obra: {
            select: {
              monto_asignado: true
            }
          }
        }
      })

      if (!gasto) {
        throw new Error('Gasto no encontrado')
      }

      // Verificar que el avance existe
      const avance = await tx.avances_obra.findFirst({
        where: {
          id: avance_obra_id,
          deleted_at: null
        }
      })

      if (!avance) {
        throw new Error('Avance de obra no encontrado')
      }

      // Calcular monto disponible
      const montoTotal = Number(gasto.monto)
      const montoYaAsignado = gasto.gastos_avances_obra.reduce(
        (sum, gao) => sum + Number(gao.monto_asignado),
        0
      )
      const montoDisponible = montoTotal - montoYaAsignado

      if (montoAsignado > montoDisponible) {
        throw new Error(`El monto asignado (${montoAsignado}) no puede ser mayor al disponible (${montoDisponible})`)
      }

      // Verificar que no existe ya una vinculación entre este gasto y avance
      const vinculacionExistente = await tx.gastos_avances_obra.findFirst({
        where: {
          gasto_id,
          avance_obra_id
        }
      })

      if (vinculacionExistente) {
        throw new Error('Este gasto ya está vinculado a este avance')
      }

      // Crear la vinculación
      const vinculacion = await tx.gastos_avances_obra.create({
        data: {
          gasto_id,
          avance_obra_id,
          monto_asignado: montoAsignado,
          notas: notas || null,
          created_at: new Date(),
          updated_at: new Date()
        }
      })

      return vinculacion
    })

    return NextResponse.json({
      success: true,
      vinculacion: result
    })
  } catch (error: any) {
    console.error('Error al vincular gasto:', error)
    return NextResponse.json(
      { error: error.message || 'Error al vincular gasto' },
      { status: 500 }
    )
  }
}