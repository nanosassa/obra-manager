import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { canEdit } from '@/lib/permissions'
import {
  validarDistribucion,
  validarGastosCompatibles,
  obtenerEstadoId
} from '@/lib/pagoUtils'

// POST - Crear pago con distribuciones
export async function POST(req: NextRequest) {
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
        { error: 'No tienes permisos para crear pagos' },
        { status: 403 }
      )
    }

    const body = await req.json()

    // Validar campos requeridos
    if (!body.monto_total || !body.fecha_pago || !body.distribuciones || body.distribuciones.length === 0) {
      return NextResponse.json(
        { error: 'Monto total, fecha y al menos una distribución son requeridos' },
        { status: 400 }
      )
    }

    const { monto_total, fecha_pago, distribuciones, metodo_pago_id, comprobante, notas } = body

    // Validar que las distribuciones no excedan el monto total
    const validacionDistribucion = validarDistribucion(monto_total, distribuciones)
    if (!validacionDistribucion.valido) {
      return NextResponse.json(
        { error: validacionDistribucion.error },
        { status: 400 }
      )
    }

    // Validar que todos los gastos sean compatibles (mismo proveedor/persona/proyecto)
    const gastosIds = distribuciones.map((d: any) => d.gasto_id)
    const validacionGastos = await validarGastosCompatibles(gastosIds)
    if (!validacionGastos.valido) {
      return NextResponse.json(
        { error: validacionGastos.error },
        { status: 400 }
      )
    }

    // Validar que ninguna distribución exceda el saldo pendiente de su gasto
    const gastos = await prisma.gastos.findMany({
      where: { id: { in: gastosIds }, deleted_at: null },
      include: {
        pagos_gastos: {
          include: {
            pagos: true
          }
        }
      }
    })

    for (const dist of distribuciones) {
      const gasto = gastos.find(g => g.id === dist.gasto_id)
      if (!gasto) {
        return NextResponse.json(
          { error: `Gasto ${dist.gasto_id} no encontrado` },
          { status: 404 }
        )
      }

      const totalPagado = gasto.pagos_gastos
        .filter((pg: any) => !pg.deleted_at && pg.pagos && !pg.pagos.deleted_at)
        .reduce(
          (sum: number, pg: any) => sum + Number(pg.monto_aplicado),
          0
        )
      const saldoPendiente = Number(gasto.monto) - totalPagado

      if (dist.monto > saldoPendiente) {
        return NextResponse.json(
          {
            error: `La distribución de $${dist.monto} al gasto "${gasto.descripcion}" excede su saldo pendiente de $${saldoPendiente}`
          },
          { status: 400 }
        )
      }
    }

    // Usar transacción para atomicidad
    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Crear el pago
      const pago = await tx.pagos.create({
        data: {
          fecha_pago: new Date(fecha_pago),
          monto_total,
          proveedor_id: validacionGastos.datos!.proveedor_id,
          pago_persona_id: validacionGastos.datos!.persona_id,
          proyecto_obra_id: validacionGastos.datos!.proyecto_id,
          metodo_pago_id: metodo_pago_id || null,
          comprobante: comprobante || null,
          notas: notas || null
        }
      })

      // 2. Crear distribuciones (pagos_gastos)
      const distribucionesCreadas = await Promise.all(
        distribuciones.map((dist: any) =>
          tx.pagos_gastos.create({
            data: {
              pago_id: pago.id,
              gasto_id: dist.gasto_id,
              monto_aplicado: dist.monto
            }
          })
        )
      )

      // 3. Actualizar estados de los gastos afectados
      for (const dist of distribuciones) {
        const gasto = gastos.find(g => g.id === dist.gasto_id)!

        // Calcular nuevo total pagado
        const totalPagadoAnterior = gasto.pagos_gastos
          .filter((pg: any) => !pg.deleted_at && pg.pagos && !pg.pagos.deleted_at)
          .reduce(
            (sum: number, pg: any) => sum + Number(pg.monto_aplicado),
            0
          )
        const nuevoTotalPagado = totalPagadoAnterior + dist.monto

        // Determinar nuevo estado
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

        await tx.gastos.update({
          where: { id: dist.gasto_id },
          data: { estado_id: estadoId }
        })
      }

      return { pago, distribuciones: distribucionesCreadas }
    })

    return NextResponse.json(resultado, { status: 201 })
  } catch (error) {
    console.error('Error al crear pago:', error)
    return NextResponse.json(
      { error: 'Error al crear pago' },
      { status: 500 }
    )
  }
}

// GET - Listar pagos
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const proyectoId = searchParams.get('proyecto_id')
    const proveedorId = searchParams.get('proveedor_id')
    const personaId = searchParams.get('persona_id')

    const where: any = {
      deleted_at: null
    }

    if (proyectoId) where.proyecto_obra_id = proyectoId
    if (proveedorId) where.proveedor_id = proveedorId
    if (personaId) where.pago_persona_id = personaId

    const pagos = await prisma.pagos.findMany({
      where,
      include: {
        proveedores: true,
        personas: true,
        metodos_pago: true,
        pagos_gastos: {
          where: { deleted_at: null },
          include: {
            gastos: {
              select: {
                id: true,
                descripcion: true,
                monto: true
              }
            }
          }
        }
      },
      orderBy: { fecha_pago: 'desc' }
    })

    // Serializar y calcular saldo no imputado
    const pagosFormateados = pagos.map(p => {
      const totalDistribuido = p.pagos_gastos.reduce(
        (sum, pg) => sum + Number(pg.monto_aplicado),
        0
      )

      return {
        ...p,
        monto_total: Number(p.monto_total),
        saldo_no_imputado: Number(p.monto_total) - totalDistribuido,
        pagos_gastos: p.pagos_gastos.map(pg => ({
          ...pg,
          monto_aplicado: Number(pg.monto_aplicado),
          gastos: {
            ...pg.gastos,
            monto: Number(pg.gastos.monto)
          }
        }))
      }
    })

    return NextResponse.json(pagosFormateados)
  } catch (error) {
    console.error('Error al obtener pagos:', error)
    return NextResponse.json(
      { error: 'Error al obtener pagos' },
      { status: 500 }
    )
  }
}
