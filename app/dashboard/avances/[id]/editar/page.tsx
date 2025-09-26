'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

interface FormData {
  descripcion: string
  proveedor: string
  monto_presupuestado: string
  porcentaje_avance: string
  notas: string
}

export default function EditarAvancePage() {
  const router = useRouter()
  const params = useParams()
  const avanceId = params.id as string

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [formData, setFormData] = useState<FormData>({
    descripcion: '',
    proveedor: '',
    monto_presupuestado: '',
    porcentaje_avance: '0',
    notas: ''
  })

  // Cargar datos del avance
  useEffect(() => {
    const fetchAvance = async () => {
      try {
        const response = await fetch(`/api/avances/${avanceId}`)
        if (!response.ok) throw new Error('Error al obtener avance')

        const avance = await response.json()

        setFormData({
          descripcion: avance.descripcion || '',
          proveedor: avance.proveedor || '',
          monto_presupuestado: avance.monto_presupuestado ? avance.monto_presupuestado.toString() : '',
          porcentaje_avance: avance.porcentaje_avance ? avance.porcentaje_avance.toString() : '0',
          notas: avance.notas || ''
        })
      } catch (error) {
        console.error('Error:', error)
        alert('Error al cargar el avance')
        router.push('/dashboard/avances')
      } finally {
        setLoadingData(false)
      }
    }

    if (avanceId) {
      fetchAvance()
    }
  }, [avanceId, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.descripcion.trim() || !formData.proveedor.trim()) {
      alert('Descripción y proveedor son requeridos')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/avances', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: avanceId,
          descripcion: formData.descripcion.trim(),
          proveedor: formData.proveedor.trim(),
          monto_presupuestado: formData.monto_presupuestado ? parseFloat(formData.monto_presupuestado) : null,
          porcentaje_avance: parseFloat(formData.porcentaje_avance) || 0,
          notas: formData.notas.trim() || null
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar el avance')
      }

      router.push('/dashboard/avances')
    } catch (error) {
      console.error('Error:', error)
      alert(error instanceof Error ? error.message : 'Error al actualizar el avance')
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
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
            <h2 className="text-3xl font-bold tracking-tight">Editar Avance de Obra</h2>
            <p className="text-gray-500">Cargando datos...</p>
          </div>
        </div>
        <Card className="max-w-2xl">
          <CardContent className="p-8">
            <div className="text-center">Cargando...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/avances">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Editar Avance de Obra</h2>
          <p className="text-gray-500">
            Modifica los datos del avance
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Información del Avance</CardTitle>
          <CardDescription>
            Actualiza los datos del avance de obra
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4">
              {/* Descripción */}
              <div className="space-y-2">
                <Label htmlFor="descripcion">
                  Descripción *
                </Label>
                <Input
                  id="descripcion"
                  name="descripcion"
                  type="text"
                  placeholder="Ej: Instalación eléctrica"
                  value={formData.descripcion}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Proveedor */}
              <div className="space-y-2">
                <Label htmlFor="proveedor">
                  Proveedor *
                </Label>
                <Input
                  id="proveedor"
                  name="proveedor"
                  type="text"
                  placeholder="Ej: ElectroTech SA"
                  value={formData.proveedor}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Monto Presupuestado */}
              <div className="space-y-2">
                <Label htmlFor="monto_presupuestado">
                  Monto Presupuestado (ARS)
                </Label>
                <Input
                  id="monto_presupuestado"
                  name="monto_presupuestado"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.monto_presupuestado}
                  onChange={handleChange}
                />
              </div>

              {/* Porcentaje de Avance */}
              <div className="space-y-2">
                <Label htmlFor="porcentaje_avance">
                  Porcentaje de Avance (%)
                </Label>
                <Input
                  id="porcentaje_avance"
                  name="porcentaje_avance"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="0"
                  value={formData.porcentaje_avance}
                  onChange={handleChange}
                />
              </div>

              {/* Notas */}
              <div className="space-y-2">
                <Label htmlFor="notas">
                  Notas
                </Label>
                <Textarea
                  id="notas"
                  name="notas"
                  placeholder="Notas adicionales sobre el avance..."
                  value={formData.notas}
                  onChange={handleChange}
                  rows={3}
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
              <Link href="/dashboard/avances">
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}