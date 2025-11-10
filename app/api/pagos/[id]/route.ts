import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { canDelete } from '@/lib/permissions'
import { obtenerEstadoId } from '@/lib/pagoUtils'

// GET - Obtener un pago específico
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { id } = await params

    const pago = await prisma.pagos.findUnique({
      where: { id, deleted_at: null },
      include: {
        proveedores: true,
        personas: true,
        metodos_pago: true,
        proyectos_obra: true,
        pagos_gastos: {
          where: { deleted_at: null },
          include: {
            gastos: {
              include: {
                categorias_gasto: true,
                estados_pago: true
              }
            }
          }
        }
      }
    })

    if (!pago) {
      return NextResponse.json(
        { error: 'Pago no encontrado' },
        { status: 404 }
      )
    }

    // Calcular saldo no imputado
    const totalDistribuido = pago.pagos_gastos.reduce(
      (sum, pg) => sum + Number(pg.monto_aplicado),
      0
    )

    const pagoFormateado = {
      ...pago,
      monto_total: Number(pago.monto_total),
      saldo_no_imputado: Number(pago.monto_total) - totalDistribuido,
      pagos_gastos: pago.pagos_gastos.map(pg => ({
        ...pg,
        monto_aplicado: Number(pg.monto_aplicado),
        gastos: {
          ...pg.gastos,
          monto: Number(pg.gastos.monto)
        }
      }))
    }

    return NextResponse.json(pagoFormateado)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Error al obtener pago' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar pago (soft delete, revierte distribuciones)
export async function DELETE(
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

    if (!canDelete(session.user.role as any)) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar pagos' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Obtener pago con distribuciones
    const pago = await prisma.pagos.findUnique({
      where: { id, deleted_at: null },
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

    // Transacción: eliminar pago + distribuciones + recalcular estados
    await prisma.$transaction(async (tx) => {
      const ahora = new Date()

      // 1. Soft delete del pago
      await tx.pagos.update({
        where: { id },
        data: { deleted_at: ahora }
      })

      // 2. Soft delete de todas las distribuciones
      await tx.pagos_gastos.updateMany({
        where: { pago_id: id },
        data: { deleted_at: ahora }
      })

      // 3. Recalcular estados de los gastos afectados
      const gastosAfectados = pago.pagos_gastos.map(pg => pg.gasto_id)

      for (const gastoId of gastosAfectados) {
        // Obtener pagos restantes del gasto
        const distribucionesRestantes = await tx.pagos_gastos.findMany({
          where: {
            gasto_id: gastoId,
            deleted_at: null,
            pagos: {
              deleted_at: null
            }
          }
        })

        const gasto = await tx.gastos.findUnique({
          where: { id: gastoId }
        })

        if (!gasto) continue

        const totalPagado = distribucionesRestantes.reduce(
          (sum, pg) => sum + Number(pg.monto_aplicado),
          0
        )

        // Determinar nuevo estado
        let nuevoEstado: 'PENDIENTE' | 'PAGADO PARCIAL' | 'PAGADO'
        if (totalPagado === 0) {
          nuevoEstado = 'PENDIENTE'
        } else if (totalPagado >= Number(gasto.monto)) {
          nuevoEstado = 'PAGADO'
        } else {
          nuevoEstado = 'PAGADO PARCIAL'
        }

        const estadoObj = await tx.estados_pago.findFirst({
          where: {
            nombre: { equals: nuevoEstado, mode: 'insensitive' },
            deleted_at: null
          }
        })

        if (estadoObj) {
          await tx.gastos.update({
            where: { id: gastoId },
            data: { estado_id: estadoObj.id }
          })
        }
      }
    })

    return NextResponse.json({
      success: true,
      mensaje: 'Pago eliminado y distribuciones revertidas'
    })
  } catch (error) {
    console.error('Error al eliminar pago:', error)
    return NextResponse.json(
      { error: 'Error al eliminar pago' },
      { status: 500 }
    )
  }
}
