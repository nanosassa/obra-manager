'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { formatCurrency, formatDate, getEstadoBadgeVariant, getCategoriaBadgeVariant } from "@/lib/utils"
import DeleteGastoButton from "@/components/DeleteGastoButton"

interface Gasto {
  id: string
  descripcion: string
  monto: number
  fecha: string
  numero_comprobante: string | null
  notas: string | null
  created_at: string
  updated_at: string
  categorias_gasto: {
    id: string
    nombre: string
  }
  proveedores: {
    id: string
    nombre: string
  } | null
  personas: {
    id: string
    nombre: string
  } | null
  metodos_pago: {
    id: string
    nombre: string
  }
  estados_pago: {
    id: string
    nombre: string
  }
  gastos_avances_obra: Array<{
    id: string
    monto_asignado: number
    notas: string | null
    avances_obra: {
      id: string
      descripcion: string
    }
  }>
}

export default function GastoDetailPage() {
  const params = useParams()
  const gastoId = params.id as string

  const [gasto, setGasto] = useState<Gasto | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchGasto = async () => {
      try {
        const response = await fetch(`/api/gastos/${gastoId}`)
        if (!response.ok) throw new Error('Error al obtener gasto')

        const gasto = await response.json()
        setGasto(gasto)
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    if (gastoId) {
      fetchGasto()
    }
  }, [gastoId])

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/gastos">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Detalle del Gasto</h2>
            <p className="text-gray-500">Cargando...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!gasto) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/gastos">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Gasto no encontrado</h2>
            <p className="text-gray-500">El gasto solicitado no existe</p>
          </div>
        </div>
      </div>
    )
  }

  const totalAsignado = gasto.gastos_avances_obra.reduce((sum, gao) => sum + gao.monto_asignado, 0)
  const montoSinAsignar = gasto.monto - totalAsignado

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/gastos">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{gasto.descripcion}</h2>
            <p className="text-gray-500">
              Detalle del gasto del {formatDate(gasto.fecha)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/gastos/${gasto.id}/editar`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>
          <DeleteGastoButton
            gastoId={gasto.id}
            gastoDescripcion={gasto.descripcion}
          />
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Monto Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(gasto.monto)}</div>
            <p className="text-xs text-gray-500">gasto registrado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Estado de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={getEstadoBadgeVariant(gasto.estados_pago.nombre)}>
              {gasto.estados_pago.nombre}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Asignado a Avances</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAsignado)}</div>
            <p className="text-xs text-gray-500">
              {gasto.gastos_avances_obra.length} vinculaciones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Sin Asignar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(montoSinAsignar)}</div>
            <p className="text-xs text-gray-500">
              {((montoSinAsignar / gasto.monto) * 100).toFixed(1)}% del total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Information */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información del Gasto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Categoría:</span>
                <Badge variant={getCategoriaBadgeVariant(gasto.categorias_gasto.nombre)}>
                  {gasto.categorias_gasto.nombre}
                </Badge>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Proveedor:</span>
                <span className="font-semibold">
                  {gasto.proveedores?.nombre || 'Sin proveedor'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Método de Pago:</span>
                <span className="font-semibold">{gasto.metodos_pago.nombre}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Persona:</span>
                <span className="font-semibold">
                  {gasto.personas?.nombre || 'Sin asignar'}
                </span>
              </div>
              {gasto.numero_comprobante && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">N° Comprobante:</span>
                  <span className="font-semibold">{gasto.numero_comprobante}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Información Adicional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div>
                <span className="text-gray-600 block text-sm">Notas:</span>
                <p className="mt-1 text-gray-900">
                  {gasto.notas || 'Sin notas adicionales'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div>
                  <span className="text-gray-600 block text-xs">Creado:</span>
                  <span className="text-sm">
                    {new Date(gasto.created_at).toLocaleDateString('es-AR')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 block text-xs">Actualizado:</span>
                  <span className="text-sm">
                    {new Date(gasto.updated_at).toLocaleDateString('es-AR')}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vinculaciones con Avances */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Vinculaciones con Avances de Obra</CardTitle>
              <CardDescription>
                {gasto.gastos_avances_obra.length} vinculaciones registradas
              </CardDescription>
            </div>
            <Link href={`/dashboard/gastos/${gasto.id}/editar`}>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Editar Vinculaciones
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {gasto.gastos_avances_obra.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Este gasto no está vinculado a ningún avance de obra
            </div>
          ) : (
            <div className="space-y-3">
              {gasto.gastos_avances_obra.map((gao) => (
                <div key={gao.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{gao.avances_obra.descripcion}</p>
                    {gao.notas && (
                      <p className="text-sm text-gray-500">{gao.notas}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(gao.monto_asignado)}</p>
                    <p className="text-xs text-gray-500">
                      {((gao.monto_asignado / gasto.monto) * 100).toFixed(1)}% del gasto
                    </p>
                  </div>
                </div>
              ))}
              {montoSinAsignar > 0 && (
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex justify-between items-center">
                    <p className="font-medium text-yellow-800">Monto sin asignar</p>
                    <p className="font-semibold text-yellow-800">{formatCurrency(montoSinAsignar)}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}