import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireCreatePermission, requireEditPermission, requireDeletePermission } from '@/lib/checkRole'

// GET - Obtener avances
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const proyectoId = searchParams.get('proyectoId')

    // Obtener proyecto
    const proyecto = await prisma.proyectos_obra.findFirst({
      where: {
        nombre: "Habitacion Nuestra",
        deleted_at: null
      }
    });

    if (!proyecto) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      )
    }

    // Obtener avances con sus gastos
    const avances = await prisma.avances_obra.findMany({
      where: {
        proyecto_obra_id: proyecto.id,
        deleted_at: null
      },
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
    const avancesConProgreso = avances.map(avance => {
      const totalGastado = avance.gastos_avances_obra.reduce(
        (sum, gao) => sum + Number(gao.monto_asignado),
        0
      )

      const presupuesto = Number(avance.monto_presupuestado) || 0
      const porcentajeGastado = presupuesto > 0
        ? (totalGastado / presupuesto) * 100
        : 0

      return {
        ...avance,
        monto_presupuestado: presupuesto,
        porcentaje_avance: Number(avance.porcentaje_avance) || 0,
        total_gastado: totalGastado,
        porcentaje_gastado: porcentajeGastado,
        gastos_count: avance.gastos_avances_obra.length
      }
    })

    return NextResponse.json({
      avances: avancesConProgreso,
      proyecto: {
        id: proyecto.id,
        nombre: proyecto.nombre,
        presupuesto_total: Number(proyecto.presupuesto_total) || 0
      }
    })
  } catch (error) {
    console.error('Error al obtener avances:', error)
    return NextResponse.json(
      { error: 'Error al obtener avances' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo avance
export async function POST(req: NextRequest) {
  // Verificar permisos de creación (bloquea viewers y contadores)
  const { error } = await requireCreatePermission()
  if (error) return error

  try {
    const body = await req.json()

    // Obtener proyecto
    const proyecto = await prisma.proyectos_obra.findFirst({
      where: {
        nombre: "Habitacion Nuestra",
        deleted_at: null
      }
    });

    if (!proyecto) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      )
    }

    // Validar campos requeridos
    if (!body.descripcion || !body.proveedor) {
      return NextResponse.json(
        { error: 'Descripción y proveedor son requeridos' },
        { status: 400 }
      )
    }

    // Crear avance
    const avance = await prisma.avances_obra.create({
      data: {
        proyecto_obra_id: proyecto.id,
        descripcion: body.descripcion,
        proveedor: body.proveedor,
        monto_presupuestado: body.monto_presupuestado ? parseFloat(body.monto_presupuestado) : null,
        porcentaje_avance: body.porcentaje_avance ? parseFloat(body.porcentaje_avance) : 0,
        notas: body.notas || null,
        created_at: new Date(),
        updated_at: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      avance
    })
  } catch (error: any) {
    console.error('Error al crear avance:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear avance' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar avance
export async function PUT(req: NextRequest) {
  // Verificar permisos de edición (bloquea viewers)
  const { error } = await requireEditPermission()
  if (error) return error

  try {
    const body = await req.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID del avance es requerido' },
        { status: 400 }
      )
    }

    // Preparar datos para actualización
    const updateData: any = {
      updated_at: new Date()
    }

    if (data.descripcion !== undefined) updateData.descripcion = data.descripcion
    if (data.proveedor !== undefined) updateData.proveedor = data.proveedor
    if (data.monto_presupuestado !== undefined) {
      updateData.monto_presupuestado = data.monto_presupuestado ? parseFloat(data.monto_presupuestado) : null
    }
    if (data.porcentaje_avance !== undefined) {
      updateData.porcentaje_avance = parseFloat(data.porcentaje_avance) || 0
    }
    if (data.notas !== undefined) updateData.notas = data.notas || null

    // Actualizar avance
    const avance = await prisma.avances_obra.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      avance
    })
  } catch (error: any) {
    console.error('Error al actualizar avance:', error)
    return NextResponse.json(
      { error: error.message || 'Error al actualizar avance' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar avance (soft delete)
export async function DELETE(req: NextRequest) {
  // Verificar permisos de eliminación (solo admins)
  const { error } = await requireDeletePermission()
  if (error) return error

  try {
    const searchParams = req.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID del avance es requerido' },
        { status: 400 }
      )
    }

    // Verificar si hay gastos vinculados
    const gastosVinculados = await prisma.gastos_avances_obra.count({
      where: { avance_obra_id: id }
    })

    if (gastosVinculados > 0) {
      return NextResponse.json(
        { error: `No se puede eliminar el avance porque tiene ${gastosVinculados} gastos vinculados` },
        { status: 400 }
      )
    }

    // Soft delete
    const avance = await prisma.avances_obra.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        updated_at: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Avance eliminado correctamente'
    })
  } catch (error) {
    console.error('Error al eliminar avance:', error)
    return NextResponse.json(
      { error: 'Error al eliminar avance' },
      { status: 500 }
    )
  }
}