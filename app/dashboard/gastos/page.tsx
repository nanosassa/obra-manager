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
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  Eye
} from "lucide-react"
import Link from "next/link"
import prisma from "@/lib/prisma"
import { formatCurrency, formatDate, getEstadoBadgeVariant, getCategoriaBadgeVariant } from "@/lib/utils"

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
  if (searchParams.desde) {
    where.fecha = { ...where.fecha, gte: new Date(searchParams.desde) };
  }
  if (searchParams.hasta) {
    where.fecha = { ...where.fecha, lte: new Date(searchParams.hasta) };
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
  const [categorias, personas, estados] = await Promise.all([
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
    })
  ]);

  return { categorias, personas, estados };
}

export default async function GastosPage({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const [data, filterOptions] = await Promise.all([
    getGastosData(searchParams),
    getFilterOptions()
  ]);

  const { proyecto, gastos, total, totalPages, currentPage, totalMonto } = data;

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
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Link href="/dashboard/gastos/nuevo">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Gasto
            </Button>
          </Link>
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
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-wrap gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Categoría
              </label>
              <select 
                name="categoria"
                defaultValue={searchParams.categoria as string || ''}
                className="border rounded-md px-3 py-2 text-sm"
              >
                <option value="">Todas</option>
                {filterOptions.categorias.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Pagado por
              </label>
              <select 
                name="persona"
                defaultValue={searchParams.persona as string || ''}
                className="border rounded-md px-3 py-2 text-sm"
              >
                <option value="">Todos</option>
                {filterOptions.personas.map(per => (
                  <option key={per.id} value={per.id}>
                    {per.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Estado
              </label>
              <select 
                name="estado"
                defaultValue={searchParams.estado as string || ''}
                className="border rounded-md px-3 py-2 text-sm"
              >
                <option value="">Todos</option>
                {filterOptions.estados.map(est => (
                  <option key={est.id} value={est.id}>
                    {est.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Desde
              </label>
              <input 
                type="date"
                name="desde"
                defaultValue={searchParams.desde as string || ''}
                className="border rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Hasta
              </label>
              <input 
                type="date"
                name="hasta"
                defaultValue={searchParams.hasta as string || ''}
                className="border rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div className="flex items-end">
              <Button type="submit" variant="outline">
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Gastos</CardTitle>
          <CardDescription>
            {total} gastos encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
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
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/dashboard/gastos/${gasto.id}/editar`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
