import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  TrendingUp,
  DollarSign,
  Package,
  Calendar,
  PieChart,
  BarChart3,
  Target,
  AlertTriangle
} from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"
import prisma from '@/lib/prisma'
import GastosPorCategoriaChart from "@/components/charts/GastosPorCategoriaChart"

async function getReportesData() {
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
        avances: [],
        resumen: null
      }
    }

    // Obtener gastos con categorías
    const gastos = await prisma.gastos.findMany({
      where: {
        proyecto_obra_id: proyecto.id,
        deleted_at: null
      },
      include: {
        categorias_gasto: {
          select: {
            nombre: true
          }
        },
        estados_pago: {
          select: {
            nombre: true
          }
        }
      },
      orderBy: {
        fecha: 'desc'
      }
    })

    // Obtener avances
    const avances = await prisma.avances_obra.findMany({
      where: {
        proyecto_obra_id: proyecto.id,
        deleted_at: null
      },
      include: {
        gastos_avances_obra: {
          select: {
            monto_asignado: true
          }
        }
      }
    })

    // Calcular resumen ejecutivo
    const totalGastos = gastos.reduce((sum, gasto) => sum + Number(gasto.monto), 0)
    const presupuestoTotal = Number(proyecto.presupuesto_total) || 0
    const gastosEsteMes = gastos.filter(gasto => {
      const fechaGasto = new Date(gasto.fecha)
      const ahora = new Date()
      return fechaGasto.getMonth() === ahora.getMonth() &&
             fechaGasto.getFullYear() === ahora.getFullYear()
    })
    const totalEsteMes = gastosEsteMes.reduce((sum, gasto) => sum + Number(gasto.monto), 0)

    const gastosPagados = gastos.filter(g => g.estados_pago.nombre.toLowerCase().includes('pagado'))
    const gastosPendientes = gastos.filter(g => !g.estados_pago.nombre.toLowerCase().includes('pagado'))

    const progresoPromedio = avances.length > 0
      ? avances.reduce((sum, avance) => sum + Number(avance.porcentaje_avance), 0) / avances.length
      : 0

    // Gastos por categoría
    const coloresPorDefecto = ['#8B5CF6', '#EF4444', '#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#84CC16', '#F97316']
    const gastosPorCategoria = gastos.reduce((acc: any, gasto) => {
      const categoria = gasto.categorias_gasto.nombre
      if (!acc[categoria]) {
        const categoriasExistentes = Object.keys(acc).length
        acc[categoria] = {
          nombre: categoria,
          total: 0,
          count: 0,
          color: coloresPorDefecto[categoriasExistentes % coloresPorDefecto.length]
        }
      }
      acc[categoria].total += Number(gasto.monto)
      acc[categoria].count += 1
      return acc
    }, {})

    const categorias = Object.values(gastosPorCategoria) as Array<{
      nombre: string
      total: number
      count: number
      color: string
    }>

    return {
      proyecto,
      gastos,
      avances,
      resumen: {
        totalGastos,
        presupuestoTotal,
        totalEsteMes,
        gastosCount: gastos.length,
        gastosPagados: gastosPagados.length,
        gastosPendientes: gastosPendientes.length,
        avancesCount: avances.length,
        progresoPromedio,
        porcentajePresupuesto: presupuestoTotal > 0 ? (totalGastos / presupuestoTotal) * 100 : 0
      },
      categorias
    }
  } catch (error) {
    console.error('Error al obtener datos de reportes:', error)
    return {
      proyecto: null,
      gastos: [],
      avances: [],
      resumen: null,
      categorias: []
    }
  }
}

// Deshabilitar generación estática para páginas con DB
export const dynamic = 'force-dynamic'

export default async function ReportesPage() {
  const data = await getReportesData()
  const { proyecto, resumen, categorias } = data

  if (!proyecto || !resumen) {
    return (
      <div className="p-4 md:p-8">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">Reportes</h2>
        <p className="text-red-500">Error: No se pudieron cargar los datos del proyecto</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Reportes</h2>
        <p className="text-gray-500 text-sm md:text-base">
          Análisis y estadísticas del proyecto
        </p>
      </div>

      {/* Resumen Ejecutivo */}
      <div>
        <h3 className="text-lg md:text-xl font-semibold mb-4">Resumen Ejecutivo</h3>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {/* Total Gastado */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs md:text-sm font-medium flex items-center">
                <DollarSign className="h-4 w-4 mr-1 md:mr-2" />
                <span className="hidden md:inline">Total Gastado</span>
                <span className="md:hidden">Gastado</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold">{formatCurrency(resumen.totalGastos)}</div>
              <p className="text-xs text-gray-500">
                {resumen.porcentajePresupuesto.toFixed(1)}% del presupuesto
              </p>
            </CardContent>
          </Card>

          {/* Este Mes */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs md:text-sm font-medium flex items-center">
                <Calendar className="h-4 w-4 mr-1 md:mr-2" />
                <span className="hidden md:inline">Este Mes</span>
                <span className="md:hidden">Mes</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold">{formatCurrency(resumen.totalEsteMes)}</div>
              <p className="text-xs text-gray-500">{resumen.gastosCount} gastos total</p>
            </CardContent>
          </Card>

          {/* Progreso Promedio */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs md:text-sm font-medium flex items-center">
                <TrendingUp className="h-4 w-4 mr-1 md:mr-2" />
                <span className="hidden md:inline">Progreso</span>
                <span className="md:hidden">Avance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold">{resumen.progresoPromedio.toFixed(1)}%</div>
              <p className="text-xs text-gray-500">{resumen.avancesCount} avances</p>
            </CardContent>
          </Card>

          {/* Estado Pagos */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs md:text-sm font-medium flex items-center">
                <Package className="h-4 w-4 mr-1 md:mr-2" />
                <span className="hidden md:inline">Pagos</span>
                <span className="md:hidden">Estado</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 md:gap-2">
                <Badge variant="secondary" className="text-xs">
                  {resumen.gastosPagados} ✓
                </Badge>
                {resumen.gastosPendientes > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {resumen.gastosPendientes} !
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-500">pagados / pendientes</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Alertas */}
      {resumen.porcentajePresupuesto > 90 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">Alerta de Presupuesto</p>
                <p className="text-sm text-yellow-700">
                  Has gastado {resumen.porcentajePresupuesto.toFixed(1)}% del presupuesto total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gastos por Categoría */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Gastos por Categoría
          </CardTitle>
          <CardDescription>
            Distribución de gastos por tipo de categoría
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GastosPorCategoriaChart data={categorias} />
        </CardContent>
      </Card>

      {/* Enlaces a reportes detallados */}
      <div>
        <h3 className="text-lg md:text-xl font-semibold mb-4">Reportes Detallados</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Gastos por Período
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500 mb-3">Análisis mensual de gastos</p>
              <Button size="sm" variant="outline" className="w-full">
                Ver Reporte
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4" />
                Progreso vs Presupuesto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500 mb-3">Avances y costos por partida</p>
              <Button size="sm" variant="outline" className="w-full">
                Ver Reporte
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Tendencias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500 mb-3">Patrones y proyecciones</p>
              <Button size="sm" variant="outline" className="w-full">
                Ver Reporte
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
