import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate, getEstadoBadgeVariant } from "@/lib/utils"

interface Gasto {
  id: string
  fecha: Date
  descripcion: string
  monto: any
  categorias_gasto?: { nombre: string } | null
  personas?: { nombre: string } | null
  estados_pago?: { nombre: string } | null
}

interface UltimosGastosProps {
  gastos: Gasto[]
}

export function UltimosGastos({ gastos }: UltimosGastosProps) {
  if (gastos.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        No hay gastos registrados
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {gastos.map((gasto) => (
        <div key={gasto.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-medium text-gray-900">
                {gasto.descripcion}
              </p>
              {gasto.categorias_gasto && (
                <Badge variant="secondary" className="text-xs">
                  {gasto.categorias_gasto.nombre}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
              <span>{formatDate(gasto.fecha)}</span>
              {gasto.personas && (
                <span>• Pagado por {gasto.personas.nombre}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {gasto.estados_pago && (
              <Badge variant={getEstadoBadgeVariant(gasto.estados_pago.nombre)}>
                {gasto.estados_pago.nombre}
              </Badge>
            )}
            <span className="font-semibold text-lg">
              {formatCurrency(Number(gasto.monto))}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
