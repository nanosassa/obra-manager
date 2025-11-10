import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { canEdit } from '@/lib/permissions'
import { obtenerEstadoId } from '@/lib/pagoUtils'

// PATCH - Marcar gasto como pagado (crea pago automático)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication and permissions
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    if (!canEdit(session.user.role as any)) {
      return NextResponse.json(
        { error: 'No tienes permisos para marcar gastos como pagados' },
        { status: 403 }
      )
    }

    const { id: gastoId } = await params

    // Obtener gasto
    const gasto = await prisma.gastos.findUnique({
      where: { id: gastoId, deleted_at: null },
      include: {
        pagos_gastos: {
          include: {
            pagos: true
          }
        }
      }
    })

    if (!gasto) {
      return NextResponse.json(
        { error: 'Gasto no encontrado' },
        { status: 404 }
      )
    }

    // Calcular saldo pendiente - filtrar solo pagos_gastos y pagos activos
    const totalPagado = gasto.pagos_gastos
      .filter((pg: any) => !pg.deleted_at && pg.pagos && !pg.pagos.deleted_at)
      .reduce(
        (sum: number, pg: any) => sum + Number(pg.monto_aplicado),
        0
      )
    const saldoPendiente = Number(gasto.monto) - totalPagado

    if (saldoPendiente <= 0) {
      return NextResponse.json(
        { error: 'El gasto ya está completamente pagado' },
        { status: 400 }
      )
    }

    // Obtener estado PAGADO
    const estadoPagadoId = await obtenerEstadoId('PAGADO')
    if (!estadoPagadoId) {
      return NextResponse.json(
        { error: 'Estado PAGADO no encontrado' },
        { status: 500 }
      )
    }

    // Transacción: crear pago + distribución + actualizar estado
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Crear pago por el saldo pendiente
      const pago = await tx.pagos.create({
        data: {
          fecha_pago: new Date(),
          monto_total: saldoPendiente,
          proveedor_id: gasto.proveedor_id,
          pago_persona_id: gasto.pago_persona_id,
          proyecto_obra_id: gasto.proyecto_obra_id,
          metodo_pago_id: gasto.metodo_pago_id,
          notas: 'Pago automático al marcar gasto como pagado'
        }
      })

      // 2. Crear distribución completa
      await tx.pagos_gastos.create({
        data: {
          pago_id: pago.id,
          gasto_id: gastoId,
          monto_aplicado: saldoPendiente
        }
      })

      // 3. Actualizar estado a PAGADO
      await tx.gastos.update({
        where: { id: gastoId },
        data: { estado_id: estadoPagadoId }
      })

      return pago
    })

    return NextResponse.json({
      success: true,
      mensaje: 'Gasto marcado como pagado',
      pago: {
        ...resultado,
        monto_total: Number(resultado.monto_total)
      }
    })
  } catch (error) {
    console.error('Error al marcar como pagado:', error)
    return NextResponse.json(
      { error: 'Error al marcar gasto como pagado' },
      { status: 500 }
    )
  }
}
