import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { canEdit } from '@/lib/permissions'
import { obtenerEstadoId } from '@/lib/pagoUtils'

// POST - Aplicar saldo no imputado de un pago a un gasto
export async function POST(
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
        { error: 'No tienes permisos para aplicar saldos' },
        { status: 403 }
      )
    }

    const { id: pagoId } = await params
    const body = await req.json()

    if (!body.gasto_id || !body.monto_aplicado) {
      return NextResponse.json(
        { error: 'gasto_id y monto_aplicado son requeridos' },
        { status: 400 }
      )
    }

    const { gasto_id, monto_aplicado } = body

    // Validar que el pago existe
    const pago = await prisma.pagos.findUnique({
      where: { id: pagoId, deleted_at: null },
      include: {
        pagos_gastos: {
          where: { deleted_at: null }
        }
      }
    })

    if (!pago) {
      return NextResponse.json(
        { error: 'Pago no encontrado' },
        { status: 404 }
      )
    }

    // Validar que el gasto existe y es compatible
    const gasto = await prisma.gastos.findUnique({
      where: { id: gasto_id, deleted_at: null },
      include: {
        pagos_gastos: {
          where: { deleted_at: null }
        }
      }
    })

    if (!gasto) {
      return NextResponse.json(
        { error: 'Gasto no encontrado' },
        { status: 404 }
      )
    }

    // Validar compatibilidad (mismo proveedor/persona/proyecto)
    if (gasto.proveedor_id !== pago.proveedor_id ||
        gasto.pago_persona_id !== pago.pago_persona_id ||
        gasto.proyecto_obra_id !== pago.proyecto_obra_id) {
      return NextResponse.json(
        { error: 'El gasto no es compatible con este pago (diferente proveedor, persona o proyecto)' },
        { status: 400 }
      )
    }

    // Calcular saldo disponible del pago
    const totalDistribuido = pago.pagos_gastos.reduce(
      (sum, pg) => sum + Number(pg.monto_aplicado),
      0
    )
    const saldoDisponible = Number(pago.monto_total) - totalDistribuido

    if (monto_aplicado > saldoDisponible) {
      return NextResponse.json(
        { error: `El monto excede el saldo disponible del pago ($${saldoDisponible})` },
        { status: 400 }
      )
    }

    // Calcular saldo pendiente del gasto
    const totalPagadoGasto = gasto.pagos_gastos.reduce(
      (sum, pg) => sum + Number(pg.monto_aplicado),
      0
    )
    const saldoPendienteGasto = Number(gasto.monto) - totalPagadoGasto

    if (monto_aplicado > saldoPendienteGasto) {
      return NextResponse.json(
        { error: `El monto excede el saldo pendiente del gasto ($${saldoPendienteGasto})` },
        { status: 400 }
      )
    }

    // Transacción: crear distribución + actualizar estado del gasto
    const resultado = await prisma.$transaction(async (tx) => {
      // Crear distribución
      const distribucion = await tx.pagos_gastos.create({
        data: {
          pago_id: pagoId,
          gasto_id,
          monto_aplicado
        }
      })

      // Calcular nuevo estado del gasto
      const nuevoTotalPagado = totalPagadoGasto + monto_aplicado
      let nuevoEstado: 'PENDIENTE' | 'PAGADO PARCIAL' | 'PAGADO'

      if (nuevoTotalPagado === 0) {
        nuevoEstado = 'PENDIENTE'
      } else if (nuevoTotalPagado >= Number(gasto.monto)) {
        nuevoEstado = 'PAGADO'
      } else {
        nuevoEstado = 'PAGADO PARCIAL'
      }

      const estadoId = await obtenerEstadoId(nuevoEstado)
      if (!estadoId) {
        throw new Error(`Estado "${nuevoEstado}" no encontrado`)
      }

      // Actualizar estado del gasto
      await tx.gastos.update({
        where: { id: gasto_id },
        data: { estado_id: estadoId }
      })

      return distribucion
    })

    return NextResponse.json({
      success: true,
      mensaje: 'Saldo aplicado correctamente',
      distribucion: {
        ...resultado,
        monto_aplicado: Number(resultado.monto_aplicado)
      }
    })
  } catch (error) {
    console.error('Error al aplicar saldo:', error)
    return NextResponse.json(
      { error: 'Error al aplicar saldo' },
      { status: 500 }
    )
  }
}
