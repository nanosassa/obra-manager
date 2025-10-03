import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { estado_id } = await request.json()

    if (!estado_id) {
      return NextResponse.json(
        { error: 'El estado_id es requerido' },
        { status: 400 }
      )
    }

    // Verificar que el gasto existe
    const gasto = await prisma.gastos.findUnique({
      where: {
        id,
        deleted_at: null
      }
    })

    if (!gasto) {
      return NextResponse.json(
        { error: 'Gasto no encontrado' },
        { status: 404 }
      )
    }

    // Actualizar el estado del gasto
    const gastoActualizado = await prisma.gastos.update({
      where: { id },
      data: {
        estado_id,
        updated_at: new Date()
      }
    })

    return NextResponse.json({
      message: 'Gasto marcado como pagado exitosamente',
      gasto: {
        ...gastoActualizado,
        monto: Number(gastoActualizado.monto)
      }
    })

  } catch (error) {
    console.error('Error al marcar gasto como pagado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}