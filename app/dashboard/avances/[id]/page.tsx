'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit, Trash2, Plus } from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"

interface Avance {
  id: string
  descripcion: string
  proveedor: string
  monto_presupuestado: number | null
  porcentaje_avance: number
  notas: string | null
  total_gastado: number
  porcentaje_gastado: number
  gastos_count: number
  gastos_avances_obra: any[]
  created_at: string
  updated_at: string
}

export default function AvanceDetailPage() {
  const params = useParams()
  const avanceId = params.id as string

  const [avance, setAvance] = useState<Avance | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAvance = async () => {
      try {
        const response = await fetch(`/api/avances/${avanceId}`)
        if (!response.ok) throw new Error('Error al obtener avance')

        const avance = await response.json()
        setAvance(avance)
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    if (avanceId) {
      fetchAvance()
    }
  }, [avanceId])

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/avances">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Detalle del Avance</h2>
            <p className="text-gray-500">Cargando...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!avance) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/avances">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Avance no encontrado</h2>
            <p className="text-gray-500">El avance solicitado no existe</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/avances">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{avance.descripcion}</h2>
            <p className="text-gray-500">
              Detalle del avance de obra
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/avances/${avance.id}/editar`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>
          <Button variant="outline" size="sm">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Proveedor</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="text-base">
              {avance.proveedor}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Progreso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{avance.porcentaje_avance}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all"
                  style={{ width: `${Math.min(avance.porcentaje_avance, 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Gastos Vinculados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avance.gastos_count}</div>
            <p className="text-xs text-gray-500">gastos registrados</p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Information */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información Presupuestaria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Presupuesto:</span>
                <span className="font-semibold">
                  {avance.monto_presupuestado ? formatCurrency(avance.monto_presupuestado) : 'Sin definir'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Total Gastado:</span>
                <span className="font-semibold">{formatCurrency(avance.total_gastado)}</span>
              </div>
              {avance.monto_presupuestado && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">% del Presupuesto:</span>
                  <Badge variant={avance.porcentaje_gastado > 100 ? "destructive" : "secondary"}>
                    {avance.porcentaje_gastado.toFixed(1)}%
                  </Badge>
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
                  {avance.notas || 'Sin notas adicionales'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div>
                  <span className="text-gray-600 block text-xs">Creado:</span>
                  <span className="text-sm">
                    {new Date(avance.created_at).toLocaleDateString('es-AR')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 block text-xs">Actualizado:</span>
                  <span className="text-sm">
                    {new Date(avance.updated_at).toLocaleDateString('es-AR')}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gastos Vinculados */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Gastos Vinculados</CardTitle>
              <CardDescription>
                {avance.gastos_count} gastos asociados a este avance
              </CardDescription>
            </div>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Vincular Gasto
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {avance.gastos_avances_obra.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay gastos vinculados a este avance
            </div>
          ) : (
            <div className="space-y-3">
              {avance.gastos_avances_obra.map((gao: any) => (
                <div key={gao.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{gao.gastos?.descripcion || 'Gasto eliminado'}</p>
                    <p className="text-sm text-gray-500">
                      {gao.gastos?.fecha ? new Date(gao.gastos.fecha).toLocaleDateString('es-AR') : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(gao.monto_asignado)}</p>
                    <p className="text-xs text-gray-500">
                      de {gao.gastos?.monto ? formatCurrency(gao.gastos.monto) : 'N/A'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}