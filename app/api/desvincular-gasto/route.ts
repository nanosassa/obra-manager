import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// DELETE - Desvincular un gasto de un avance de obra
export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const vinculacionId = searchParams.get('id')

    if (!vinculacionId) {
      return NextResponse.json(
        { error: 'ID de vinculación es requerido' },
        { status: 400 }
      )
    }

    // Verificar que la vinculación existe
    const vinculacion = await prisma.gastos_avances_obra.findUnique({
      where: { id: vinculacionId },
      include: {
        gastos: {
          select: {
            descripcion: true
          }
        },
        avances_obra: {
          select: {
            descripcion: true
          }
        }
      }
    })

    if (!vinculacion) {
      return NextResponse.json(
        { error: 'Vinculación no encontrada' },
        { status: 404 }
      )
    }

    // Eliminar la vinculación
    await prisma.gastos_avances_obra.delete({
      where: { id: vinculacionId }
    })

    return NextResponse.json({
      success: true,
      message: `Gasto "${vinculacion.gastos.descripcion}" desvinculado del avance "${vinculacion.avances_obra.descripcion}"`
    })
  } catch (error) {
    console.error('Error al desvincular gasto:', error)
    return NextResponse.json(
      { error: 'Error al desvincular gasto' },
      { status: 500 }
    )
  }
}