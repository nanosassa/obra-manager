import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Plus,
  TrendingUp,
  DollarSign,
  Package,
  Edit,
  Trash2,
  Eye
} from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"
import prisma from '@/lib/prisma'
import DeleteAvanceButton from "@/components/DeleteAvanceButton"
import AvancesFiltros from "@/components/AvancesFiltros"
import ExportarAvancesPDF from "@/components/ExportarAvancesPDF"

async function getAvancesData(searchParams: any) {
  try {
    // Obtener proyecto
    const proyecto = await prisma.proyectos_obra.findFirst({
      where: {
        nombre: "Habitacion Nuestra",
        deleted_at: null
      }
    });

    if (!proyecto) {
      return { avances: [], proyecto: null, proveedores: [] }
    }

    // Construir filtros
    const where: any = {
      proyecto_obra_id: proyecto.id,
      deleted_at: null
    }

    if (searchParams.proveedor) {
      where.proveedor = searchParams.proveedor
    }

    if (searchParams.busqueda) {
      where.OR = [
        { descripcion: { contains: searchParams.busqueda, mode: 'insensitive' } },
        { notas: { contains: searchParams.busqueda, mode: 'insensitive' } }
      ]
    }

    if (searchParams.presupuestoMin) {
      where.monto_presupuestado = {
        ...where.monto_presupuestado,
        gte: parseFloat(searchParams.presupuestoMin)
      }
    }

    if (searchParams.presupuestoMax) {
      where.monto_presupuestado = {
        ...where.monto_presupuestado,
        lte: parseFloat(searchParams.presupuestoMax)
      }
    }

    // Obtener avances con sus gastos
    const avances = await prisma.avances_obra.findMany({
      where,
      include: {
        gastos_avances_obra: {
          include: {
            gastos: {
              select: {
                id: true,
                descripcion: true,
                monto: true,
                fecha: true
              }
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    // Calcular totales y progreso
    let avancesConProgreso = avances.map(avance => {
      const totalGastado = avance.gastos_avances_obra.reduce(
        (sum, gao) => sum + Number(gao.monto_asignado),
        0
      )

      const presupuesto = Number(avance.monto_presupuestado) || 0
      const porcentajeGastado = presupuesto > 0
        ? (totalGastado / presupuesto) * 100
        : 0

      return {
        id: avance.id,
        descripcion: avance.descripcion,
        proveedor: avance.proveedor,
        notas: avance.notas,
        created_at: avance.created_at,
        updated_at: avance.updated_at,
        monto_presupuestado: presupuesto,
        porcentaje_avance: Number(avance.porcentaje_avance) || 0,
        total_gastado: totalGastado,
        porcentaje_gastado: porcentajeGastado,
        gastos_count: avance.gastos_avances_obra.length,
        // Serializar gastos_avances_obra para componentes cliente
        gastos_avances_obra: avance.gastos_avances_obra.map(gao => ({
          id: gao.id,
          monto_asignado: Number(gao.monto_asignado),
          gastos: {
            id: gao.gastos.id,
            descripcion: gao.gastos.descripcion,
            monto: Number(gao.gastos.monto),
            fecha: gao.gastos.fecha
          }
        }))
      }
    })

    // Filtrar por porcentaje de avance (client-side porque es calculado)
    if (searchParams.avanceMin) {
      const minAvance = parseFloat(searchParams.avanceMin)
      avancesConProgreso = avancesConProgreso.filter(a => a.porcentaje_avance >= minAvance)
    }
    if (searchParams.avanceMax) {
      const maxAvance = parseFloat(searchParams.avanceMax)
      avancesConProgreso = avancesConProgreso.filter(a => a.porcentaje_avance <= maxAvance)
    }

    // Obtener lista única de proveedores
    const proveedoresUnicos = [...new Set(avances.map(a => a.proveedor))].sort()

    return {
      avances: avancesConProgreso,
      proyecto: {
        id: proyecto.id,
        nombre: proyecto.nombre,
        presupuesto_total: Number(proyecto.presupuesto_total) || 0
      },
      proveedores: proveedoresUnicos
    }
  } catch (error) {
    console.error('Error in getAvancesData:', error)
    return { avances: [], proyecto: null, proveedores: [] }
  }
}

// Deshabilitar generación estática para páginas con DB
export const dynamic = 'force-dynamic'

export default async function AvancesPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams
  const data = await getAvancesData(resolvedSearchParams)
  const { avances, proyecto, proveedores } = data

  if (!proyecto) {
    return (
      <div className="p-8">
        <p className="text-red-500">Error: Proyecto no encontrado</p>
      </div>
    );
  }

  // Calcular totales
  const totalAvances = avances.length
  const totalPresupuestado = avances.reduce((sum: number, avance: any) => sum + (avance.monto_presupuestado || 0), 0)
  const totalGastado = avances.reduce((sum: number, avance: any) => sum + avance.total_gastado, 0)
  const progresoPromedio = avances.length > 0
    ? avances.reduce((sum: number, avance: any) => sum + avance.porcentaje_avance, 0) / avances.length
    : 0

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Avances de Obra</h2>
          <p className="text-gray-500">
            Seguimiento del progreso del proyecto
          </p>
        </div>
        <div className="flex gap-2">
          <ExportarAvancesPDF
            avances={avances}
            proyecto={proyecto}
            filtrosAplicados={resolvedSearchParams}
          />
          <Link href="/dashboard/avances/nuevo">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Avance
            </Button>
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <AvancesFiltros proveedores={proveedores} />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Package className="h-4 w-4 mr-2" />
              Total Avances
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAvances}</div>
            <p className="text-xs text-gray-500">items de trabajo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Presupuestado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPresupuestado)}</div>
            <p className="text-xs text-gray-500">total planificado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Gastado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalGastado)}</div>
            <p className="text-xs text-gray-500">
              {totalPresupuestado > 0 ? `${((totalGastado / totalPresupuestado) * 100).toFixed(1)}% del presupuesto` : 'del total'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Progreso Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progresoPromedio.toFixed(1)}%</div>
            <p className="text-xs text-gray-500">avance general</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Avances</CardTitle>
          <CardDescription>
            {totalAvances} avances de obra registrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[250px]">Descripción</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Presupuesto</TableHead>
                  <TableHead>Gastado</TableHead>
                  <TableHead>Progreso</TableHead>
                  <TableHead>Gastos</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {avances.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No hay avances registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  avances.map((avance: any) => (
                    <TableRow key={avance.id}>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="min-w-[200px] cursor-help">
                                <p className="font-medium">{avance.descripcion}</p>
                                {avance.notas && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    {avance.notas.length > 100
                                      ? `${avance.notas.substring(0, 100)}...`
                                      : avance.notas
                                    }
                                  </p>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <div>
                                <p className="font-medium mb-1">{avance.descripcion}</p>
                                {avance.notas && (
                                  <p className="text-xs">{avance.notas}</p>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {avance.proveedor}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {avance.monto_presupuestado ? (
                          <span className="font-medium">
                            {formatCurrency(avance.monto_presupuestado)}
                          </span>
                        ) : (
                          <span className="text-gray-400">Sin definir</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {formatCurrency(avance.total_gastado)}
                        </span>
                        {avance.monto_presupuestado && (
                          <div className="text-xs text-gray-500">
                            {avance.porcentaje_gastado.toFixed(1)}% del presupuesto
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>{avance.porcentaje_avance}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${Math.min(avance.porcentaje_avance, 100)}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {avance.gastos_count} gastos
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/dashboard/avances/${avance.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/dashboard/avances/${avance.id}/editar`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <DeleteAvanceButton
                            avanceId={avance.id}
                            avanceDescripcion={avance.descripcion}
                            gastosCount={avance.gastos_count}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
