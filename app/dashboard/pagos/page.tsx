import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DollarSign, FileText, Plus } from "lucide-react"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"
import prisma from '@/lib/prisma'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

async function getPagosData() {
  try {
    // Obtener proyecto
    const proyecto = await prisma.proyectos_obra.findFirst({
      where: {
        nombre: "Habitacion Nuestra",
        deleted_at: null
      }
    })

    if (!proyecto) {
      return { pagos: [], proyecto: null }
    }

    // Obtener pagos
    const pagos = await prisma.pagos.findMany({
      where: {
        proyecto_obra_id: proyecto.id,
        deleted_at: null
      },
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
        (sum: number, pg: any) => sum + Number(pg.monto_aplicado),
        0
      )

      return {
        id: p.id,
        fecha_pago: p.fecha_pago,
        monto_total: Number(p.monto_total),
        saldo_no_imputado: Number(p.monto_total) - totalDistribuido,
        comprobante: p.comprobante,
        notas: p.notas,
        proveedor: p.proveedores?.nombre || 'Sin proveedor',
        persona: p.personas ? `${p.personas.nombre} ${p.personas.apellido || ''}`.trim() : null,
        metodo_pago: p.metodos_pago?.nombre || null,
        gastos_count: p.pagos_gastos.length,
        pagos_gastos: p.pagos_gastos.map((pg: any) => ({
          id: pg.id,
          monto_aplicado: Number(pg.monto_aplicado),
          gastos: {
            ...pg.gastos,
            monto: Number(pg.gastos.monto)
          }
        }))
      }
    })

    return {
      pagos: pagosFormateados,
      proyecto: {
        id: proyecto.id,
        nombre: proyecto.nombre
      }
    }
  } catch (error) {
    console.error('Error al obtener pagos:', error)
    return { pagos: [], proyecto: null }
  }
}

export const dynamic = 'force-dynamic'

export default async function PagosPage() {
  // Check authentication
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  const { pagos, proyecto } = await getPagosData()

  if (!proyecto) {
    return (
      <div className="p-8">
        <p className="text-red-500">Error: Proyecto no encontrado</p>
      </div>
    )
  }

  // Calcular totales
  const totalPagos = pagos.length
  const montoTotalPagado = pagos.reduce((sum, p) => sum + p.monto_total, 0)
  const totalSaldosNoImputados = pagos.reduce((sum, p) => sum + p.saldo_no_imputado, 0)
  const pagosConSaldo = pagos.filter(p => p.saldo_no_imputado > 0)

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestión de Pagos</h2>
          <p className="text-gray-500">
            Administra los pagos y distribuciones del proyecto
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Total Pagos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPagos}</div>
            <p className="text-xs text-gray-500">pagos registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Monto Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(montoTotalPagado)}</div>
            <p className="text-xs text-gray-500">pagado en total</p>
          </CardContent>
        </Card>

        <Card className={pagosConSaldo.length > 0 ? 'border-green-200 bg-green-50' : ''}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-green-600" />
              Saldos Disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{formatCurrency(totalSaldosNoImputados)}</div>
            <p className="text-xs text-green-600">{pagosConSaldo.length} pago{pagosConSaldo.length !== 1 ? 's' : ''} con saldo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Distribuciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pagos.reduce((sum, p) => sum + p.gastos_count, 0)}
            </div>
            <p className="text-xs text-gray-500">gastos con pago</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Pagos</CardTitle>
          <CardDescription>
            {totalPagos} pagos registrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Proveedor / Persona</TableHead>
                  <TableHead>Monto Total</TableHead>
                  <TableHead>Distribuido</TableHead>
                  <TableHead>Saldo Disponible</TableHead>
                  <TableHead>Gastos</TableHead>
                  <TableHead>Comprobante</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No hay pagos registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  pagos.map((pago) => {
                    const tieneSaldo = pago.saldo_no_imputado > 0
                    const distribuido = pago.monto_total - pago.saldo_no_imputado

                    return (
                      <TableRow key={pago.id} className={tieneSaldo ? 'bg-green-50' : ''}>
                        <TableCell className="font-medium">
                          {formatDate(pago.fecha_pago)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{pago.proveedor}</p>
                            {pago.persona && (
                              <p className="text-xs text-gray-500">{pago.persona}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(pago.monto_total)}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{formatCurrency(distribuido)}</span>
                          {pago.monto_total > 0 && (
                            <p className="text-xs text-gray-500">
                              {((distribuido / pago.monto_total) * 100).toFixed(0)}%
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          {tieneSaldo ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              {formatCurrency(pago.saldo_no_imputado)}
                            </Badge>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {pago.gastos_count} gasto{pago.gastos_count !== 1 ? 's' : ''}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {pago.comprobante ? (
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {pago.comprobante}
                            </code>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
