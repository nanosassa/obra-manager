import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

interface ResumenCardsProps {
  totalGastado: number
  presupuesto: number | null
  gastosPendientes: number
  avances: number
}

export function ResumenCards({ 
  totalGastado, 
  presupuesto, 
  gastosPendientes, 
  avances 
}: ResumenCardsProps) {
  const porcentajeEjecutado = presupuesto 
    ? (totalGastado / presupuesto) * 100 
    : 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">
            Total Gastado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(totalGastado)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">
            Presupuesto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {presupuesto ? formatCurrency(presupuesto) : "Sin definir"}
          </div>
          {presupuesto && (
            <div className="text-xs text-gray-500 mt-1">
              {porcentajeEjecutado.toFixed(1)}% ejecutado
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">
            Pagos Pendientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {formatCurrency(gastosPendientes)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">
            Avances de Obra
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avances}</div>
          <div className="text-xs text-gray-500 mt-1">Items activos</div>
        </CardContent>
      </Card>
    </div>
  )
}
