import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET - Obtener un gasto específico
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const gastoId = params.id

    const gasto = await prisma.gastos.findFirst({
      where: {
        id: gastoId,
        deleted_at: null
      },
      include: {
        categorias_gasto: {
          select: {
            id: true,
            nombre: true
          }
        },
        proveedores: {
          select: {
            id: true,
            nombre: true
          }
        },
        personas: {
          select: {
            id: true,
            nombre: true
          }
        },
        metodos_pago: {
          select: {
            id: true,
            nombre: true
          }
        },
        estados_pago: {
          select: {
            id: true,
            nombre: true
          }
        },
        gastos_avances_obra: {
          include: {
            avances_obra: {
              select: {
                id: true,
                descripcion: true
              }
            }
          }
        }
      }
    })

    if (!gasto) {
      return NextResponse.json(
        { error: 'Gasto no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(gasto)
  } catch (error) {
    console.error('Error al obtener gasto:', error)
    return NextResponse.json(
      { error: 'Error al obtener gasto' },
      { status: 500 }
    )
  }
}