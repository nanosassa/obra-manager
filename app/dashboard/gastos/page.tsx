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
  Plus,
  Download,
  Edit,
  Trash2,
  Eye
} from "lucide-react"
import Link from "next/link"
import prisma from "@/lib/prisma"
import { formatCurrency, formatDate, getEstadoBadgeVariant, getCategoriaBadgeVariant } from "@/lib/utils"
import DeleteGastoButton from "@/components/DeleteGastoButton"
import GastosFiltros from "@/components/GastosFiltros"
import ExportarGastosPDF from "@/components/ExportarGastosPDF"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { canCreate, canExport, canEdit, canDelete } from "@/lib/permissions"

async function getGastosData(searchParams: any) {
  // Obtener proyecto principal
  const proyecto = await prisma.proyectos_obra.findFirst({
    where: {
      nombre: "Habitacion Nuestra",
      deleted_at: null
    }
  });

  if (!proyecto) {
    return { gastos: [], total: 0, proyecto: null };
  }

  // Filtros
  const where: any = {
    proyecto_obra_id: proyecto.id,
    deleted_at: null
  };

  // Aplicar filtros si existen
  if (searchParams.categoria) {
    where.categoria_id = searchParams.categoria;
  }
  if (searchParams.persona) {
    where.pago_persona_id = searchParams.persona;
  }
  if (searchParams.estado) {
    where.estado_id = searchParams.estado;
  }
  if (searchParams.proveedor) {
    where.proveedor_id = searchParams.proveedor;
  }
  if (searchParams.desde) {
    where.fecha = { ...where.fecha, gte: new Date(searchParams.desde) };
  }
  if (searchParams.hasta) {
    where.fecha = { ...where.fecha, lte: new Date(searchParams.hasta) };
  }
  if (searchParams.busqueda) {
    where.descripcion = {
      contains: searchParams.busqueda,
      mode: 'insensitive'
    };
  }
  if (searchParams.montoMin) {
    where.monto = { ...where.monto, gte: parseFloat(searchParams.montoMin) };
  }
  if (searchParams.montoMax) {
    where.monto = { ...where.monto, lte: parseFloat(searchParams.montoMax) };
  }

  // Paginación
  const page = parseInt(searchParams.page || '1');
  const limit = 10;
  const skip = (page - 1) * limit;

  // Obtener gastos con relaciones
  const [gastosRaw, total] = await Promise.all([
    prisma.gastos.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        fecha: 'desc'
      },
      include: {
        categorias_gasto: true,
        personas: true,
        proveedores: true,
        estados_pago: true,
        metodos_pago: true,
        gastos_avances_obra: {
          include: {
            avances_obra: true
          }
        }
      }
    }),
    prisma.gastos.count({ where })
  ]);

  // Convertir Decimals a números
  const gastos = gastosRaw.map(gasto => ({
    ...gasto,
    monto: Number(gasto.monto),
    gastos_avances_obra: gasto.gastos_avances_obra.map(gao => ({
      ...gao,
      monto_asignado: Number(gao.monto_asignado),
      avances_obra: {
        ...gao.avances_obra,
        monto_presupuestado: gao.avances_obra.monto_presupuestado ? 
          Number(gao.avances_obra.monto_presupuestado) : null,
        porcentaje_avance: gao.avances_obra.porcentaje_avance ? 
          Number(gao.avances_obra.porcentaje_avance) : null
      }
    }))
  }));

  // Calcular totales
  const totales = await prisma.gastos.aggregate({
    _sum: {
      monto: true
    },
    where
  });

  return {
    proyecto,
    gastos,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    totalMonto: Number(totales._sum.monto || 0)
  };
}

// Obtener opciones para filtros
async function getFilterOptions() {
  const [categorias, personas, estados, proveedores] = await Promise.all([
    prisma.categorias_gasto.findMany({
      where: { deleted_at: null, activo: true },
      orderBy: { nombre: 'asc' }
    }),
    prisma.personas.findMany({
      where: { deleted_at: null, activo: true },
      orderBy: { nombre: 'asc' }
    }),
    prisma.estados_pago.findMany({
      where: { deleted_at: null, activo: true },
      orderBy: { nombre: 'asc' }
    }),
    prisma.proveedores.findMany({
      where: { deleted_at: null, activo: true },
      orderBy: { nombre: 'asc' }
    })
  ]);

  return { categorias, personas, estados, proveedores };
}

// Deshabilitar generación estática para páginas con DB
export const dynamic = 'force-dynamic'

export default async function GastosPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams
  const [data, filterOptions, session] = await Promise.all([
    getGastosData(resolvedSearchParams),
    getFilterOptions(),
    getServerSession(authOptions)
  ]);

  const { proyecto, gastos, total, totalPages, currentPage, totalMonto } = data;
  const userRole = session?.user?.role as any;
  const canCreateGastos = canCreate(userRole);
  const canExportGastos = canExport(userRole);
  const canEditGastos = canEdit(userRole);
  const canDeleteGastos = canDelete(userRole);

  if (!proyecto) {
    return (
      <div className="p-8">
        <p className="text-red-500">Error: Proyecto no encontrado</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gastos</h2>
          <p className="text-gray-500">
            Gestión de gastos del proyecto
          </p>
        </div>
        <div className="flex gap-2">
          {canExportGastos && (
            <ExportarGastosPDF
              gastos={gastos}
              totalMonto={totalMonto}
              proyecto={proyecto}
              filtrosAplicados={resolvedSearchParams}
            />
          )}
          {canCreateGastos ? (
            <Link href="/dashboard/gastos/nuevo">
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Nuevo Gasto</span>
                <span className="sm:hidden">Nuevo</span>
              </Button>
            </Link>
          ) : (
            <Button className="w-full sm:w-auto" disabled title="No tienes permisos para crear gastos">
              <Plus className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Nuevo Gasto</span>
              <span className="sm:hidden">Nuevo</span>
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total en Vista</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalMonto)}</div>
            <p className="text-xs text-gray-500">{total} gastos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(total > 0 ? totalMonto / total : 0)}
            </div>
            <p className="text-xs text-gray-500">por gasto</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Último Gasto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {gastos[0] ? formatDate(gastos[0].fecha) : 'N/A'}
            </div>
            <p className="text-xs text-gray-500">
              {gastos[0] ? formatCurrency(gastos[0].monto) : 'Sin gastos'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <GastosFiltros
        categorias={filterOptions.categorias}
        personas={filterOptions.personas}
        estados={filterOptions.estados}
        proveedores={filterOptions.proveedores}
      />

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Gastos</CardTitle>
          <CardDescription>
            {total} gastos encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Pagado por</TableHead>
                  <TableHead>Avance</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gastos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      No se encontraron gastos
                    </TableCell>
                  </TableRow>
                ) : (
                  gastos.map((gasto) => (
                    <TableRow key={gasto.id}>
                      <TableCell>{formatDate(gasto.fecha)}</TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          <p className="font-medium truncate">{gasto.descripcion}</p>
                          {gasto.numero_comprobante && (
                            <p className="text-xs text-gray-500">
                              Comp: {gasto.numero_comprobante}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getCategoriaBadgeVariant(gasto.categorias_gasto.nombre)}>
                          {gasto.categorias_gasto.nombre}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {gasto.proveedores?.nombre || '-'}
                      </TableCell>
                      <TableCell>
                        {gasto.personas ? (
                          <Badge variant="outline">
                            {gasto.personas.nombre}
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {gasto.gastos_avances_obra.length > 0 ? (
                          <div className="text-sm">
                            {gasto.gastos_avances_obra[0].avances_obra.descripcion}
                            {gasto.gastos_avances_obra.length > 1 && (
                              <span className="text-xs text-gray-500">
                                {' '}+{gasto.gastos_avances_obra.length - 1}
                              </span>
                            )}
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(gasto.monto)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getEstadoBadgeVariant(gasto.estados_pago.nombre)}>
                          {gasto.estados_pago.nombre}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/dashboard/gastos/${gasto.id}`}>
                            <Button variant="ghost" size="sm" title="Ver detalle">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {canEditGastos ? (
                            <Link href={`/dashboard/gastos/${gasto.id}/editar`}>
                              <Button variant="ghost" size="sm" title="Editar">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                          ) : (
                            <Button variant="ghost" size="sm" disabled title="No tienes permisos para editar">
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {canDeleteGastos && (
                            <DeleteGastoButton
                              gastoId={gasto.id}
                              gastoDescripcion={gasto.descripcion}
                            />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between py-4">
              <p className="text-sm text-gray-500">
                Página {currentPage} de {totalPages}
              </p>
              <div className="flex gap-2">
                {currentPage > 1 && (
                  <Link href={`/dashboard/gastos?page=${currentPage - 1}`}>
                    <Button variant="outline" size="sm">
                      Anterior
                    </Button>
                  </Link>
                )}
                {currentPage < totalPages && (
                  <Link href={`/dashboard/gastos?page=${currentPage + 1}`}>
                    <Button variant="outline" size="sm">
                      Siguiente
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
