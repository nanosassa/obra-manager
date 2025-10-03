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
  PieChart,
  Download,
  TrendingUp,
  Calendar,
  DollarSign,
  ArrowLeft
} from "lucide-react"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"
import prisma from '@/lib/prisma'

async function getReporteCategoriasData() {
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
        categorias: [],
        gastos: []
      }
    }

    // Obtener todas las categorías con sus gastos
    const categorias = await prisma.categorias_gasto.findMany({
      where: {
        deleted_at: null,
        gastos: {
          some: {
            proyecto_obra_id: proyecto.id,
            deleted_at: null
          }
        }
      },
      include: {
        gastos: {
          where: {
            proyecto_obra_id: proyecto.id,
            deleted_at: null
          },
          include: {
            personas: true,
            proveedores: true,
            estados_pago: true
          },
          orderBy: {
            fecha: 'desc'
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    })

    // Calcular totales y estadísticas por categoría
    const categoriasConTotales = categorias.map(cat => {
      const gastosPagados = cat.gastos.filter(g =>
        g.estados_pago.nombre.toLowerCase().includes('pagado')
      )
      const gastosPendientes = cat.gastos.filter(g =>
        !g.estados_pago.nombre.toLowerCase().includes('pagado')
      )

      const totalCategoria = cat.gastos.reduce((sum, g) => sum + Number(g.monto), 0)
      const totalPagado = gastosPagados.reduce((sum, g) => sum + Number(g.monto), 0)
      const totalPendiente = gastosPendientes.reduce((sum, g) => sum + Number(g.monto), 0)

      // Gastos del mes actual
      const ahora = new Date()
      const gastosEsteMes = cat.gastos.filter(g => {
        const fecha = new Date(g.fecha)
        return fecha.getMonth() === ahora.getMonth() &&
               fecha.getFullYear() === ahora.getFullYear()
      })
      const totalEsteMes = gastosEsteMes.reduce((sum, g) => sum + Number(g.monto), 0)

      return {
        ...cat,
        gastos: cat.gastos.map(g => ({
          ...g,
          monto: Number(g.monto)
        })),
        totalCategoria,
        totalPagado,
        totalPendiente,
        totalEsteMes,
        cantidadGastos: cat.gastos.length,
        cantidadPagados: gastosPagados.length,
        cantidadPendientes: gastosPendientes.length
      }
    })

    // Ordenar por total gastado
    categoriasConTotales.sort((a, b) => b.totalCategoria - a.totalCategoria)

    // Totales generales
    const totalGeneral = categoriasConTotales.reduce((sum, cat) => sum + cat.totalCategoria, 0)
    const totalPagadoGeneral = categoriasConTotales.reduce((sum, cat) => sum + cat.totalPagado, 0)
    const totalPendienteGeneral = categoriasConTotales.reduce((sum, cat) => sum + cat.totalPendiente, 0)
    const totalEsteMesGeneral = categoriasConTotales.reduce((sum, cat) => sum + cat.totalEsteMes, 0)

    return {
      proyecto,
      categorias: categoriasConTotales,
      totales: {
        general: totalGeneral,
        pagado: totalPagadoGeneral,
        pendiente: totalPendienteGeneral,
        esteMes: totalEsteMesGeneral
      }
    }
  } catch (error) {
    console.error('Error al obtener datos del reporte:', error)
    return {
      proyecto: null,
      categorias: [],
      totales: {
        general: 0,
        pagado: 0,
        pendiente: 0,
        esteMes: 0
      }
    }
  }
}

// Deshabilitar generación estática para páginas con DB
export const dynamic = 'force-dynamic'

export default async function ReporteCategoriaPage() {
  const data = await getReporteCategoriasData()
  const { proyecto, categorias, totales } = data

  if (!proyecto) {
    return (
      <div className="p-4 md:p-8">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">Reporte por Categoría</h2>
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
            <Link href="/dashboard/reportes">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Volver
              </Button>
            </Link>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            Reporte por Categoría
          </h2>
          <p className="text-gray-500 text-sm md:text-base">
            Análisis detallado de gastos por categoría
          </p>
        </div>
        <Button variant="outline" className="w-full sm:w-auto">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* Totales Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium flex items-center">
              <DollarSign className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden md:inline">Total General</span>
              <span className="md:hidden">Total</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm md:text-2xl font-bold">
              {formatCurrency(totales.general)}
            </div>
            <p className="text-xs text-gray-500">
              {categorias.length} categorías
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-green-600">
              ✓ Pagado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm md:text-2xl font-bold text-green-600">
              {formatCurrency(totales.pagado)}
            </div>
            <p className="text-xs text-gray-500">
              {totales.general > 0 ? `${((totales.pagado / totales.general) * 100).toFixed(1)}%` : '0%'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-orange-600">
              ⏳ Pendiente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm md:text-2xl font-bold text-orange-600">
              {formatCurrency(totales.pendiente)}
            </div>
            <p className="text-xs text-gray-500">
              {totales.general > 0 ? `${((totales.pendiente / totales.general) * 100).toFixed(1)}%` : '0%'}
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
            <p className="text-xs text-gray-500">gastos del mes</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Categorías */}
      {categorias.map((categoria) => (
        <Card key={categoria.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {categoria.nombre}
                  <Badge variant="outline">{categoria.cantidadGastos} gastos</Badge>
                </CardTitle>
                <CardDescription>
                  {categoria.descripcion || 'Sin descripción'}
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-xl md:text-2xl font-bold">
                  {formatCurrency(categoria.totalCategoria)}
                </div>
                <div className="text-xs text-gray-500">
                  {totales.general > 0
                    ? `${((categoria.totalCategoria / totales.general) * 100).toFixed(1)}% del total`
                    : '0%'}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Stats de la categoría */}
            <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs text-gray-500">Pagado</p>
                <p className="font-medium text-green-600">
                  {formatCurrency(categoria.totalPagado)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Pendiente</p>
                <p className="font-medium text-orange-600">
                  {formatCurrency(categoria.totalPendiente)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Este mes</p>
                <p className="font-medium">
                  {formatCurrency(categoria.totalEsteMes)}
                </p>
              </div>
            </div>

            {/* Tabla de gastos de la categoría */}
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Persona</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoria.gastos.slice(0, 5).map((gasto) => (
                    <TableRow key={gasto.id}>
                      <TableCell className="text-xs">
                        {formatDate(gasto.fecha)}
                      </TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">
                        {gasto.descripcion}
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
                          variant={gasto.estados_pago.nombre.includes('PAGADO') ? 'success' : 'warning'}
                          className="text-xs"
                        >
                          {gasto.estados_pago.nombre}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(gasto.monto)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {categoria.gastos.length > 5 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-gray-500">
                        ... y {categoria.gastos.length - 5} gastos más
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}