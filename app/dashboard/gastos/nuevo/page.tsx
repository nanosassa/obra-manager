import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { canCreate } from "@/lib/permissions"
import NuevoGastoForm from "@/components/forms/NuevoGastoForm"
import prisma from "@/lib/prisma"

async function getFormData() {
  // Obtener proyecto
  const proyecto = await prisma.proyectos_obra.findFirst({
    where: {
      nombre: "Habitacion Nuestra",
      deleted_at: null
    }
  });

  if (!proyecto) {
    return null;
  }

  // Obtener datos para los selects
  const [categorias, personas, proveedores, estados, metodos, avancesRaw] = await Promise.all([
    prisma.categorias_gasto.findMany({
      where: { deleted_at: null, activo: true },
      orderBy: { nombre: 'asc' }
    }),
    prisma.personas.findMany({
      where: { deleted_at: null, activo: true },
      orderBy: { nombre: 'asc' }
    }),
    prisma.proveedores.findMany({
      where: { deleted_at: null, activo: true },
      orderBy: { nombre: 'asc' }
    }),
    prisma.estados_pago.findMany({
      where: { deleted_at: null, activo: true },
      orderBy: { nombre: 'asc' }
    }),
    prisma.metodos_pago.findMany({
      where: { deleted_at: null, activo: true },
      orderBy: { nombre: 'asc' }
    }),
    prisma.avances_obra.findMany({
      where: {
        proyecto_obra_id: proyecto.id,
        deleted_at: null
      },
      orderBy: { descripcion: 'asc' }
    })
  ]);

  // Convertir Decimals a números en avances
  const avances = avancesRaw.map(avance => ({
    ...avance,
    monto_presupuestado: avance.monto_presupuestado ? Number(avance.monto_presupuestado) : null,
    porcentaje_avance: avance.porcentaje_avance ? Number(avance.porcentaje_avance) : null
  }));

  // Obtener el estado PAGADO por defecto
  const estadoPagado = estados.find(e => e.nombre === 'PAGADO');

  // Convertir Decimals en proyecto
  const proyectoSerializable = {
    ...proyecto,
    presupuesto_total: proyecto.presupuesto_total ? Number(proyecto.presupuesto_total) : null
  };

  return {
    proyecto: proyectoSerializable,
    categorias,
    personas,
    proveedores,
    estados,
    metodos,
    avances,
    estadoPagadoId: estadoPagado?.id
  };
}

// Deshabilitar generación estática para páginas con DB
export const dynamic = 'force-dynamic'

export default async function NuevoGastoPage() {
  // Check authentication and permissions
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  if (!canCreate(session.user.role as any)) {
    redirect('/dashboard/gastos')
  }

  const data = await getFormData();

  if (!data) {
    return (
      <div className="p-8">
        <p className="text-red-500">Error: No se pudo cargar el proyecto</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Nuevo Gasto</h2>
        <p className="text-gray-500">
          Registrar un nuevo gasto en el proyecto
        </p>
      </div>

      <NuevoGastoForm {...data} />
    </div>
  );
}
