import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  Activity
} from "lucide-react"
import prisma from "@/lib/prisma"
import { formatCurrency, formatDate } from "@/lib/utils"
import { ResumenCards } from "@/components/dashboard/ResumenCards"
import { GastosPorCategoriaChart } from "@/components/charts/GastosPorCategoria"
import { UltimosGastos } from "@/components/dashboard/UltimosGastos"
import { PagosPorPersona } from "@/components/dashboard/PagosPorPersona"

async function getDashboardData() {
  // Obtener proyecto principal
  const proyecto = await prisma.proyectos_obra.findFirst({
    where: {
      nombre: "Habitacion Nuestra",
      deleted_at: null
    }
  });

  if (!proyecto) {
    return null;
  }

  // Estadísticas generales
  const totalGastos = await prisma.gastos.count({
    where: {
      proyecto_obra_id: proyecto.id,
      deleted_at: null
    }
  });

  const montoTotal = await prisma.gastos.aggregate({
    _sum: {
      monto: true
    },
    where: {
      proyecto_obra_id: proyecto.id,
      deleted_at: null
    }
  });

  // Gastos pendientes
  const estadoPendiente = await prisma.estados_pago.findFirst({
    where: { nombre: "PENDIENTE" }
  });

  const gastosPendientes = await prisma.gastos.aggregate({
    _sum: {
      monto: true
    },
    _count: {
      id: true
    },
    where: {
      proyecto_obra_id: proyecto.id,
      estado_id: estadoPendiente?.id,
      deleted_at: null
    }
  });

  // Avances de obra
  const avances = await prisma.avances_obra.count({
    where: {
      proyecto_obra_id: proyecto.id,
      deleted_at: null
    }
  });

  // Últimos 5 gastos con relaciones corregidas
  const ultimosGastosRaw = await prisma.gastos.findMany({
    where: {
      proyecto_obra_id: proyecto.id,
      deleted_at: null
    },
    take: 5,
    orderBy: {
      fecha: 'desc'
    },
    include: {
      categorias_gasto: true,
      personas: true,
      estados_pago: true
    }
  });

  // Convertir Decimals a números
  const ultimosGastos = ultimosGastosRaw.map(gasto => ({
    ...gasto,
    monto: Number(gasto.monto)
  }));

  // Gastos por persona
  const gastosPorPersona = await prisma.gastos.groupBy({
    by: ['pago_persona_id'],
    _sum: {
      monto: true
    },
    _count: {
      id: true
    },
    where: {
      proyecto_obra_id: proyecto.id,
      deleted_at: null
    }
  });

  // Obtener nombres de personas
  const personaIds = gastosPorPersona.map(g => g.pago_persona_id).filter(id => id !== null);
  const personas = await prisma.personas.findMany({
    where: {
      id: { in: personaIds as string[] }
    }
  });

  const gastosPorPersonaConNombre = gastosPorPersona.map(gasto => {
    const persona = personas.find(p => p.id === gasto.pago_persona_id);
    return {
      ...gasto,
      _sum: {
        monto: Number(gasto._sum.monto || 0)
      },
      nombre: persona?.nombre || 'Sin asignar'
    };
  });

  return {
    proyecto: {
      ...proyecto,
      presupuesto_total: proyecto.presupuesto_total ? Number(proyecto.presupuesto_total) : null
    },
    stats: {
      totalGastos,
      montoTotal: Number(montoTotal._sum.monto || 0),
      gastosPendientes: {
        cantidad: gastosPendientes._count.id,
        monto: Number(gastosPendientes._sum.monto || 0)
      },
      avances
    },
    ultimosGastos,
    gastosPorPersona: gastosPorPersonaConNombre
  };
}

// Deshabilitar generación estática para páginas con DB
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const data = await getDashboardData();

  if (!data) {
    return (
      <div className="p-8">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-yellow-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Proyecto no encontrado</h3>
          <p className="mt-1 text-sm text-gray-500">
            No se pudo cargar el proyecto "Habitación Nuestra"
          </p>
        </div>
      </div>
    );
  }

  const { proyecto, stats, ultimosGastos, gastosPorPersona } = data;
  const presupuestoTotal = proyecto.presupuesto_total;
  const porcentajeEjecutado = presupuestoTotal 
    ? (stats.montoTotal / presupuestoTotal) * 100 
    : 0;

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-gray-500">
          Resumen del proyecto {proyecto.nombre}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gastado</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.montoTotal)}
            </div>
            <p className="text-xs text-gray-500">
              {stats.totalGastos} gastos registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Presupuesto</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {presupuestoTotal ? formatCurrency(presupuestoTotal) : "Sin definir"}
            </div>
            {presupuestoTotal && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs">
                  <span>Ejecutado</span>
                  <span>{porcentajeEjecutado.toFixed(1)}%</span>
                </div>
                <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 transition-all"
                    style={{ width: `${Math.min(porcentajeEjecutado, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagos Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(stats.gastosPendientes.monto)}
            </div>
            <p className="text-xs text-gray-500">
              {stats.gastosPendientes.cantidad} {stats.gastosPendientes.cantidad === 1 ? 'gasto' : 'gastos'} pendiente{stats.gastosPendientes.cantidad !== 1 && 's'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avances de Obra</CardTitle>
            <Activity className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avances}</div>
            <p className="text-xs text-gray-500">
              Items de trabajo activos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Tables */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Últimos Gastos */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Últimos Gastos</CardTitle>
            <CardDescription>
              Movimientos recientes del proyecto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UltimosGastos gastos={ultimosGastos} />
          </CardContent>
        </Card>

        {/* Pagos por Persona */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Resumen de Pagos</CardTitle>
            <CardDescription>
              Distribución por persona
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PagosPorPersona datos={gastosPorPersona} montoTotal={stats.montoTotal} />
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Categorías */}
      <Card>
        <CardHeader>
          <CardTitle>Gastos por Categoría</CardTitle>
          <CardDescription>
            Distribución del presupuesto por tipo de gasto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GastosPorCategoriaChart proyectoId={proyecto.id} />
        </CardContent>
      </Card>
    </div>
  );
}
