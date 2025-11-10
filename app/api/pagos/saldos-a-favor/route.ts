import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - Obtener saldos a favor por proveedor/persona/proyecto
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
    const proveedorId = searchParams.get('proveedor_id')
    const personaId = searchParams.get('persona_id')
    const proyectoId = searchParams.get('proyecto_id')

    if (!proyectoId) {
      return NextResponse.json(
        { error: 'proyecto_id es requerido' },
        { status: 400 }
      )
    }

    const where: any = {
      proyecto_obra_id: proyectoId,
      deleted_at: null
    }

    if (proveedorId) {
      where.proveedor_id = proveedorId
    }

    if (personaId !== null && personaId !== undefined) {
      where.pago_persona_id = personaId === '' ? null : personaId
    }

    // Obtener pagos del mismo proveedor/persona/proyecto
    const pagos = await prisma.pagos.findMany({
      where,
      include: {
        pagos_gastos: {
          where: { deleted_at: null }
        },
        proveedores: true,
        personas: true
      },
      orderBy: {
        fecha_pago: 'desc'
      }
    })

    // Calcular saldo no imputado por cada pago
    const saldosAFavor = pagos
      .map(pago => {
        const totalDistribuido = pago.pagos_gastos.reduce(
          (sum, pg) => sum + Number(pg.monto_aplicado),
          0
        )
        const saldo = Number(pago.monto_total) - totalDistribuido

        return {
          pago_id: pago.id,
          fecha: pago.fecha_pago,
          monto_total: Number(pago.monto_total),
          saldo_disponible: saldo,
          proveedor: pago.proveedores?.nombre || 'Sin proveedor',
          persona: pago.personas ? `${pago.personas.nombre} ${pago.personas.apellido || ''}`.trim() : null,
          comprobante: pago.comprobante
        }
      })
      .filter(s => s.saldo_disponible > 0)  // Solo los que tienen saldo

    return NextResponse.json(saldosAFavor)
  } catch (error) {
    console.error('Error al obtener saldos a favor:', error)
    return NextResponse.json(
      { error: 'Error al obtener saldos a favor' },
      { status: 500 }
    )
  }
}
