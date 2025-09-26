import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const proyectoId = searchParams.get('proyectoId')

    if (!proyectoId) {
      return NextResponse.json(
        { error: 'Proyecto ID es requerido' },
        { status: 400 }
      )
    }

    // Obtener gastos agrupados por categoría
    const gastosPorCategoria = await prisma.gastos.groupBy({
      by: ['categoria_id'],
      _sum: {
        monto: true
      },
      where: {
        proyecto_obra_id: proyectoId,
        deleted_at: null
      }
    })

    // Obtener nombres de categorías
    const categoriaIds = gastosPorCategoria.map(g => g.categoria_id)
    const categorias = await prisma.categorias_gasto.findMany({
      where: {
        id: { in: categoriaIds }
      }
    })

    // Calcular total para porcentajes
    const total = gastosPorCategoria.reduce(
      (sum, item) => sum + Number(item._sum.monto || 0),
      0
    )

    // Formatear datos para el gráfico
    const datos = gastosPorCategoria.map(gasto => {
      const categoria = categorias.find(c => c.id === gasto.categoria_id)
      const monto = Number(gasto._sum.monto || 0)
      
      return {
        categoria: categoria?.nombre || 'Sin categoría',
        total: monto,
        porcentaje: total > 0 ? (monto / total) * 100 : 0
      }
    })

    // Ordenar por monto de mayor a menor
    datos.sort((a, b) => b.total - a.total)

    return NextResponse.json(datos)
  } catch (error) {
    console.error('Error al obtener gastos por categoría:', error)
    return NextResponse.json(
      { error: 'Error al obtener datos' },
      { status: 500 }
    )
  }
}
