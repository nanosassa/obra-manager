import prisma from './prisma'

export type EstadoPago = 'PENDIENTE' | 'PAGADO PARCIAL' | 'PAGADO'

/**
 * Calcula el total pagado de un gasto sumando todas las distribuciones activas
 */
export async function calcularTotalPagado(gastoId: string): Promise<number> {
  const resultado = await prisma.pagos_gastos.aggregate({
    where: {
      gasto_id: gastoId,
      deleted_at: null,
      pagos: {
        deleted_at: null
      }
    },
    _sum: {
      monto_aplicado: true
    }
  })

  return Number(resultado._sum.monto_aplicado || 0)
}

/**
 * Calcula el saldo pendiente de un gasto
 */
export async function calcularSaldoPendiente(
  gastoId: string,
  montoGasto: number
): Promise<number> {
  const totalPagado = await calcularTotalPagado(gastoId)
  return montoGasto - totalPagado
}

/**
 * Calcula el saldo no imputado de un pago
 */
export async function calcularSaldoNoImputado(pagoId: string): Promise<number> {
  const pago = await prisma.pagos.findUnique({
    where: { id: pagoId },
    include: {
      pagos_gastos: {
        where: { deleted_at: null }
      }
    }
  })

  if (!pago) return 0

  const totalDistribuido = pago.pagos_gastos.reduce(
    (sum, pg) => sum + Number(pg.monto_aplicado),
    0
  )

  return Number(pago.monto_total) - totalDistribuido
}

/**
 * Determina el estado de pago basado en montos
 */
export async function determinarEstadoPago(
  gastoId: string,
  montoGasto: number
): Promise<EstadoPago> {
  const totalPagado = await calcularTotalPagado(gastoId)

  if (totalPagado === 0) {
    return 'PENDIENTE'
  } else if (totalPagado >= montoGasto) {
    return 'PAGADO'
  } else {
    return 'PAGADO PARCIAL'
  }
}

/**
 * Valida que la distribución no exceda el monto del pago
 */
export function validarDistribucion(
  montoPago: number,
  distribuciones: { gasto_id: string; monto: number }[]
): { valido: boolean; error?: string } {
  const totalDistribuido = distribuciones.reduce((sum, d) => sum + d.monto, 0)

  if (totalDistribuido > montoPago) {
    return {
      valido: false,
      error: `La suma de distribuciones ($${totalDistribuido}) excede el monto del pago ($${montoPago})`
    }
  }

  return { valido: true }
}

/**
 * Valida que todos los gastos sean del mismo proveedor/persona/proyecto
 */
export async function validarGastosCompatibles(
  gastosIds: string[]
): Promise<{
  valido: boolean
  error?: string
  datos?: {
    proveedor_id: string | null
    persona_id: string | null
    proyecto_id: string
  }
}> {
  const gastos = await prisma.gastos.findMany({
    where: {
      id: { in: gastosIds },
      deleted_at: null
    },
    select: {
      id: true,
      proveedor_id: true,
      pago_persona_id: true,
      proyecto_obra_id: true
    }
  })

  if (gastos.length === 0) {
    return { valido: false, error: 'No se encontraron gastos válidos' }
  }

  const primerGasto = gastos[0]

  // Validar mismo proveedor
  const gastosOtroProveedor = gastos.filter(
    g => g.proveedor_id !== primerGasto.proveedor_id
  )
  if (gastosOtroProveedor.length > 0) {
    return {
      valido: false,
      error: 'Todos los gastos deben ser del mismo proveedor'
    }
  }

  // Validar misma persona
  const gastosOtraPersona = gastos.filter(
    g => g.pago_persona_id !== primerGasto.pago_persona_id
  )
  if (gastosOtraPersona.length > 0) {
    return {
      valido: false,
      error: 'Todos los gastos deben ser de la misma persona'
    }
  }

  // Validar mismo proyecto
  const gastosOtroProyecto = gastos.filter(
    g => g.proyecto_obra_id !== primerGasto.proyecto_obra_id
  )
  if (gastosOtroProyecto.length > 0) {
    return {
      valido: false,
      error: 'Todos los gastos deben ser del mismo proyecto'
    }
  }

  return {
    valido: true,
    datos: {
      proveedor_id: primerGasto.proveedor_id,
      persona_id: primerGasto.pago_persona_id,
      proyecto_id: primerGasto.proyecto_obra_id
    }
  }
}

/**
 * Obtiene el ID del estado de pago por nombre
 */
export async function obtenerEstadoId(nombre: EstadoPago): Promise<string | null> {
  const estado = await prisma.estados_pago.findFirst({
    where: {
      nombre: { equals: nombre, mode: 'insensitive' },
      deleted_at: null
    }
  })

  return estado?.id || null
}
