import { formatCurrency } from "@/lib/utils"

interface PagoPersona {
  pago_persona_id: string | null
  _sum: {
    monto: any
  }
  _count: {
    id: number
  }
  nombre: string
}

interface PagosPorPersonaProps {
  datos: PagoPersona[]
  montoTotal: number
}

export function PagosPorPersona({ datos, montoTotal }: PagosPorPersonaProps) {
  if (datos.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        No hay pagos registrados
      </div>
    )
  }

  // Ordenar por monto de mayor a menor
  const datosOrdenados = [...datos].sort((a, b) => 
    Number(b._sum.monto) - Number(a._sum.monto)
  )

  return (
    <div className="space-y-4">
      {datosOrdenados.map((persona) => {
        const monto = Number(persona._sum.monto);
        const porcentaje = montoTotal > 0 ? (monto / montoTotal) * 100 : 0;
        
        return (
          <div key={persona.pago_persona_id || 'sin-asignar'} className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{persona.nombre}</p>
                <p className="text-sm text-gray-500">
                  {persona._count.id} {persona._count.id === 1 ? 'pago' : 'pagos'}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatCurrency(monto)}</p>
                <p className="text-sm text-gray-500">{porcentaje.toFixed(1)}%</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${porcentaje}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
