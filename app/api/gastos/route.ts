import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET - Obtener gastos
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const proyectoId = searchParams.get('proyectoId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where: any = {
      deleted_at: null
    }

    if (proyectoId) {
      where.proyecto_obra_id = proyectoId
    }

    const [gastos, total] = await Promise.all([
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
    ])

    return NextResponse.json({
      gastos,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('Error al obtener gastos:', error)
    return NextResponse.json(
      { error: 'Error al obtener gastos' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo gasto
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { vinculaciones, ...gastoData } = body

    // Validar campos requeridos
    if (!gastoData.proyecto_obra_id || !gastoData.fecha || !gastoData.descripcion || 
        !gastoData.categoria_id || !gastoData.monto || !gastoData.estado_id) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Convertir monto a Decimal
    gastoData.monto = parseFloat(gastoData.monto)

    // Convertir fecha string a Date object
    gastoData.fecha = new Date(gastoData.fecha)

    // Limpiar campos UUID opcionales - convertir strings vacíos a null
    if (gastoData.proveedor_id === '') gastoData.proveedor_id = null
    if (gastoData.metodo_pago_id === '') gastoData.metodo_pago_id = null
    if (gastoData.pago_persona_id === '') gastoData.pago_persona_id = null
    if (gastoData.presupuesto_id === '') gastoData.presupuesto_id = null
    if (gastoData.numero_comprobante === '') gastoData.numero_comprobante = null
    if (gastoData.notas === '') gastoData.notas = null

    // Si hay vinculaciones, validar que la suma sea igual al monto total
    if (vinculaciones && vinculaciones.length > 0) {
      const sumaVinculaciones = vinculaciones.reduce(
        (sum: number, v: any) => sum + parseFloat(v.monto_asignado),
        0
      )

      if (Math.abs(sumaVinculaciones - gastoData.monto) > 0.01) {
        return NextResponse.json(
          { error: `La suma de vinculaciones (${sumaVinculaciones}) no coincide con el monto total (${gastoData.monto})` },
          { status: 400 }
        )
      }
    }

    // Crear gasto con transacción
    const result = await prisma.$transaction(async (tx) => {
      // Crear el gasto
      const gasto = await tx.gastos.create({
        data: {
          ...gastoData,
          created_at: new Date(),
          updated_at: new Date()
        }
      })

      // Si hay vinculaciones, crearlas
      if (vinculaciones && vinculaciones.length > 0) {
        // Verificar presupuestos disponibles
        for (const vinc of vinculaciones) {
          // Obtener el avance
          const avance = await tx.avances_obra.findUnique({
            where: { id: vinc.avance_obra_id }
          })

          if (!avance) {
            throw new Error(`Avance de obra ${vinc.avance_obra_id} no encontrado`)
          }

          // Verificar presupuesto disponible si existe
          if (avance.monto_presupuestado) {
            // Calcular lo ya asignado
            const asignado = await tx.gastos_avances_obra.aggregate({
              where: {
                avance_obra_id: vinc.avance_obra_id
              },
              _sum: {
                monto_asignado: true
              }
            })

            const totalAsignado = Number(asignado._sum.monto_asignado || 0)
            const disponible = Number(avance.monto_presupuestado) - totalAsignado

            if (vinc.monto_asignado > disponible) {
              throw new Error(
                `Presupuesto excedido para ${avance.descripcion}. ` +
                `Disponible: ${disponible.toFixed(2)}, Intentando asignar: ${vinc.monto_asignado}`
              )
            }
          }

          // Crear la vinculación
          await tx.gastos_avances_obra.create({
            data: {
              gasto_id: gasto.id,
              avance_obra_id: vinc.avance_obra_id,
              monto_asignado: parseFloat(vinc.monto_asignado),
              notas: vinc.notas || null,
              created_at: new Date(),
              updated_at: new Date()
            }
          })
        }
      }

      return gasto
    })

    return NextResponse.json({
      success: true,
      gasto: result
    })
  } catch (error: any) {
    console.error('Error al crear gasto:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear gasto' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar gasto
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, vinculaciones, ...gastoData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID del gasto es requerido' },
        { status: 400 }
      )
    }

    // Convertir monto si existe
    if (gastoData.monto) {
      gastoData.monto = parseFloat(gastoData.monto)
    }

    // Convertir fecha si existe
    if (gastoData.fecha) {
      gastoData.fecha = new Date(gastoData.fecha)
    }

    // Limpiar campos UUID opcionales - convertir strings vacíos a null
    if (gastoData.proveedor_id === '') gastoData.proveedor_id = null
    if (gastoData.metodo_pago_id === '') gastoData.metodo_pago_id = null
    if (gastoData.pago_persona_id === '') gastoData.pago_persona_id = null
    if (gastoData.presupuesto_id === '') gastoData.presupuesto_id = null
    if (gastoData.numero_comprobante === '') gastoData.numero_comprobante = null
    if (gastoData.notas === '') gastoData.notas = null

    // Actualizar con transacción
    const result = await prisma.$transaction(async (tx) => {
      // Actualizar el gasto
      const gasto = await tx.gastos.update({
        where: { id },
        data: {
          ...gastoData,
          updated_at: new Date()
        }
      })

      // Si se enviaron vinculaciones, actualizar
      if (vinculaciones !== undefined) {
        // Eliminar vinculaciones existentes
        await tx.gastos_avances_obra.deleteMany({
          where: { gasto_id: id }
        })

        // Crear nuevas vinculaciones
        if (vinculaciones && vinculaciones.length > 0) {
          for (const vinc of vinculaciones) {
            await tx.gastos_avances_obra.create({
              data: {
                gasto_id: id,
                avance_obra_id: vinc.avance_obra_id,
                monto_asignado: parseFloat(vinc.monto_asignado),
                notas: vinc.notas || null,
                created_at: new Date(),
                updated_at: new Date()
              }
            })
          }
        }
      }

      return gasto
    })

    return NextResponse.json({
      success: true,
      gasto: result
    })
  } catch (error: any) {
    console.error('Error al actualizar gasto:', error)
    return NextResponse.json(
      { error: error.message || 'Error al actualizar gasto' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar gasto (soft delete)
export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID del gasto es requerido' },
        { status: 400 }
      )
    }

    // Soft delete
    const gasto = await prisma.gastos.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        updated_at: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Gasto eliminado correctamente'
    })
  } catch (error) {
    console.error('Error al eliminar gasto:', error)
    return NextResponse.json(
      { error: 'Error al eliminar gasto' },
      { status: 500 }
    )
  }
}
