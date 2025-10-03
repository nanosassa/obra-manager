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
import {
  AlertCircle,
  CheckCircle,
  DollarSign,
  Clock,
  CreditCard,
  ArrowLeft,
  Calendar
} from "lucide-react"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"
import prisma from '@/lib/prisma'
import MarcarPagadoButton from "@/components/MarcarPagadoButton"

async function getGastosPendientes() {
  try {
    // Obtener proyecto
    const proyecto = await prisma.proyectos_obra.findFirst({
      where: {
        nombre: "Habitacion Nuestra",
        deleted_at: null
      }
    });

    if (!proyecto) {
      return {
        proyecto: null,
        gastos: [],
        totales: {}
      }
    }

    // Obtener estado PAGADO para excluirlo
    const estadoPagado = await prisma.estados_pago.findFirst({
      where: {
        nombre: {
          contains: "PAGADO",
          mode: "insensitive"
        }
      }
    });

    // Obtener gastos pendientes
    const gastosPendientes = await prisma.gastos.findMany({
      where: {
        proyecto_obra_id: proyecto.id,
        deleted_at: null,
        NOT: {
          estado_id: estadoPagado?.id
        }
      },
      include: {
        categorias_gasto: true,
        personas: true,
        proveedores: true,
        estados_pago: true,
        metodos_pago: true
      },
      orderBy: [
        { fecha: 'asc' },
        { monto: 'desc' }
      ]
    });

    // Convertir Decimals a números y agrupar por persona
    const gastosPorPersona: { [key: string]: any } = {}

    const gastosFormateados = gastosPendientes.map(gasto => {
      const personaId = gasto.pago_persona_id || 'sin-asignar'
      const personaNombre = gasto.personas?.nombre || 'Sin asignar'

      if (!gastosPorPersona[personaId]) {
        gastosPorPersona[personaId] = {
          nombre: personaNombre,
          total: 0,
          cantidad: 0
        }
      }

      gastosPorPersona[personaId].total += Number(gasto.monto)
      gastosPorPersona[personaId].cantidad += 1

      return {
        ...gasto,
        monto: Number(gasto.monto)
      }
    })

    // Calcular totales
    const totalPendiente = gastosFormateados.reduce((sum, g) => sum + g.monto, 0)

    // Gastos vencidos (más de 30 días)
    const hoy = new Date()
    const hace30Dias = new Date(hoy.getTime() - (30 * 24 * 60 * 60 * 1000))
    const gastosVencidos = gastosFormateados.filter(g => new Date(g.fecha) < hace30Dias)
    const totalVencido = gastosVencidos.reduce((sum, g) => sum + g.monto, 0)

    // Gastos de este mes
    const gastosEsteMes = gastosFormateados.filter(g => {
      const fecha = new Date(g.fecha)
      return fecha.getMonth() === hoy.getMonth() &&
             fecha.getFullYear() === hoy.getFullYear()
    })
    const totalEsteMes = gastosEsteMes.reduce((sum, g) => sum + g.monto, 0)

    return {
      proyecto,
      gastos: gastosFormateados,
      totales: {
        pendiente: totalPendiente,
        vencido: totalVencido,
        esteMes: totalEsteMes,
        cantidad: gastosFormateados.length,
        cantidadVencidos: gastosVencidos.length
      },
      gastosPorPersona,
      estadoPagadoId: estadoPagado?.id
    }
  } catch (error) {
    console.error('Error al obtener gastos pendientes:', error)
    return {
      proyecto: null,
      gastos: [],
      totales: {},
      gastosPorPersona: {}
    }
  }
}

// Deshabilitar generación estática para páginas con DB
export const dynamic = 'force-dynamic'

export default async function GastosPendientesPage() {
  const data = await getGastosPendientes()
  const { proyecto, gastos, totales, gastosPorPersona, estadoPagadoId } = data

  if (!proyecto) {
    return (
      <div className="p-4 md:p-8">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">Gastos Pendientes</h2>
        <p className="text-red-500">Error: No se pudieron cargar los datos del proyecto</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/dashboard/gastos">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Volver
              </Button>
            </Link>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            Gastos Pendientes de Pago
          </h2>
          <p className="text-gray-500 text-sm md:text-base">
            Gestiona los pagos pendientes del proyecto
          </p>
        </div>
      </div>

      {/* Alertas */}
      {totales.cantidadVencidos > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800">
                  {totales.cantidadVencidos} gastos vencidos
                </p>
                <p className="text-sm text-red-700">
                  Total vencido: {formatCurrency(totales.vencido)} (más de 30 días)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium flex items-center">
              <Clock className="h-4 w-4 mr-1 md:mr-2 text-orange-500" />
              <span className="hidden md:inline">Total Pendiente</span>
              <span className="md:hidden">Pendiente</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm md:text-2xl font-bold text-orange-600">
              {formatCurrency(totales.pendiente)}
            </div>
            <p className="text-xs text-gray-500">
              {totales.cantidad} gastos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium flex items-center">
              <AlertCircle className="h-4 w-4 mr-1 md:mr-2 text-red-500" />
              <span className="hidden md:inline">Vencidos</span>
              <span className="md:hidden">Venc.</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm md:text-2xl font-bold text-red-600">
              {formatCurrency(totales.vencido)}
            </div>
            <p className="text-xs text-gray-500">
              +30 días
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium flex items-center">
              <Calendar className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden md:inline">Este Mes</span>
              <span className="md:hidden">Mes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm md:text-2xl font-bold">
              {formatCurrency(totales.esteMes)}
            </div>
            <p className="text-xs text-gray-500">
              por pagar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">
              Personas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm md:text-2xl font-bold">
              {Object.keys(gastosPorPersona).length}
            </div>
            <p className="text-xs text-gray-500">
              con pagos pendientes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Resumen por Persona */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen por Persona</CardTitle>
          <CardDescription>Desglose de pagos pendientes por persona</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(gastosPorPersona).map(([id, data]: [string, any]) => (
              <div key={id} className="p-3 border rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">{data.nombre}</p>
                    <p className="text-xs text-gray-500">{data.cantidad} gastos</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-orange-600">
                      {formatCurrency(data.total)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Gastos Pendientes */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Gastos Pendientes</CardTitle>
          <CardDescription>
            {totales.cantidad} gastos pendientes de pago
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Persona</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gastos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle className="h-8 w-8 text-green-500" />
                        <p className="text-gray-500">¡No hay gastos pendientes!</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  gastos.map((gasto) => {
                    const esVencido = new Date(gasto.fecha) < new Date(Date.now() - (30 * 24 * 60 * 60 * 1000))
                    return (
                      <TableRow key={gasto.id} className={esVencido ? 'bg-red-50' : ''}>
                        <TableCell className="text-xs">
                          <div className="flex items-center gap-1">
                            {esVencido && <AlertCircle className="h-3 w-3 text-red-500" />}
                            {formatDate(gasto.fecha)}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm max-w-[200px]">
                          <p className="truncate">{gasto.descripcion}</p>
                          {gasto.numero_comprobante && (
                            <p className="text-xs text-gray-500">#{gasto.numero_comprobante}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {gasto.categorias_gasto.nombre}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs">
                            {gasto.proveedores?.nombre || '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs">
                            {gasto.personas?.nombre || '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="warning"
                            className="text-xs"
                          >
                            {gasto.estados_pago.nombre}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(gasto.monto)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <MarcarPagadoButton
                              gastoId={gasto.id}
                              gastoDescripcion={gasto.descripcion}
                              monto={gasto.monto}
                              estadoPagadoId={estadoPagadoId}
                            />
                            <Link href={`/dashboard/gastos/${gasto.id}/editar`}>
                              <Button variant="ghost" size="sm">
                                Ver
                              </Button>
                            </Link>
                          </div>
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
  );
}