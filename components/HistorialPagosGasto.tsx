'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency, formatDate } from "@/lib/utils"
import { DollarSign, Calendar, CreditCard } from "lucide-react"

interface PagoGasto {
  id: string
  monto_aplicado: number
  created_at: Date
  pagos: {
    id: string
    fecha_pago: Date
    monto_total: number
    comprobante: string | null
    metodos_pago: {
      nombre: string
    } | null
  }
}

interface Props {
  pagos: PagoGasto[]
  montoTotal: number
  totalPagado: number
  saldoPendiente: number
}

export default function HistorialPagosGasto({
  pagos,
  montoTotal,
  totalPagado,
  saldoPendiente
}: Props) {
  const porcentajePagado = montoTotal > 0 ? (totalPagado / montoTotal) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Historial de Pagos
        </CardTitle>
        <CardDescription>
          {pagos.length === 0
            ? 'No hay pagos registrados para este gasto'
            : `${pagos.length} pago${pagos.length !== 1 ? 's' : ''} aplicado${pagos.length !== 1 ? 's' : ''}`
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Resumen visual */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Progreso de pago</span>
            <span className="font-medium">{porcentajePagado.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                porcentajePagado >= 100 ? 'bg-green-600' :
                porcentajePagado > 0 ? 'bg-blue-600' : 'bg-gray-400'
              }`}
              style={{ width: `${Math.min(porcentajePagado, 100)}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Monto Total</p>
              <p className="font-bold text-gray-900">{formatCurrency(montoTotal)}</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-green-600 mb-1">Pagado</p>
              <p className="font-bold text-green-700">{formatCurrency(totalPagado)}</p>
            </div>
            <div className={`text-center p-3 rounded-lg ${
              saldoPendiente > 0 ? 'bg-orange-50' : 'bg-gray-50'
            }`}>
              <p className={`text-xs mb-1 ${
                saldoPendiente > 0 ? 'text-orange-600' : 'text-gray-600'
              }`}>Saldo Pendiente</p>
              <p className={`font-bold ${
                saldoPendiente > 0 ? 'text-orange-700' : 'text-gray-700'
              }`}>{formatCurrency(saldoPendiente)}</p>
            </div>
          </div>
        </div>

        {/* Tabla de pagos */}
        {pagos.length > 0 && (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Monto Aplicado</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Comprobante</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagos.map((pg) => (
                  <TableRow key={pg.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {formatDate(pg.pagos.fecha_pago)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(pg.monto_aplicado)}
                      </span>
                      <p className="text-xs text-gray-500">
                        de {formatCurrency(pg.pagos.monto_total)}
                      </p>
                    </TableCell>
                    <TableCell>
                      {pg.pagos.metodos_pago ? (
                        <Badge variant="outline" className="text-xs">
                          <CreditCard className="h-3 w-3 mr-1" />
                          {pg.pagos.metodos_pago.nombre}
                        </Badge>
                      ) : (
                        <span className="text-xs text-gray-400">No especificado</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {pg.pagos.comprobante ? (
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {pg.pagos.comprobante}
                        </code>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
