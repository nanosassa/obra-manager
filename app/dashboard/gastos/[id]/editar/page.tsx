'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

interface FormData {
  descripcion: string
  monto: string
  fecha: string
  numero_comprobante: string
  notas: string
  categoria_gasto_id: string
  proveedor_id: string
  pago_persona_id: string
  metodo_pago_id: string
  estado_pago_id: string
}

export default function EditarGastoPage() {
  const router = useRouter()
  const params = useParams()
  const gastoId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categorias, setCategorias] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [personas, setPersonas] = useState([])
  const [metodos, setMetodos] = useState([])
  const [estados, setEstados] = useState([])

  const [formData, setFormData] = useState<FormData>({
    descripcion: '',
    monto: '',
    fecha: '',
    numero_comprobante: '',
    notas: '',
    categoria_gasto_id: '',
    proveedor_id: '',
    pago_persona_id: '',
    metodo_pago_id: '',
    estado_pago_id: ''
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cargar gasto y datos de formulario en paralelo
        const [gastoResponse, datosResponse] = await Promise.all([
          fetch(`/api/gastos/${gastoId}`),
          fetch('/api/form-data')
        ])

        if (!gastoResponse.ok) throw new Error('Error al obtener gasto')
        if (!datosResponse.ok) throw new Error('Error al obtener datos del formulario')

        const gasto = await gastoResponse.json()
        const datos = await datosResponse.json()

        // Configurar datos del formulario
        setCategorias(datos.categorias)
        setProveedores(datos.proveedores)
        setPersonas(datos.personas)
        setMetodos(datos.metodos)
        setEstados(datos.estados)

        // Configurar datos del gasto
        setFormData({
          descripcion: gasto.descripcion,
          monto: gasto.monto.toString(),
          fecha: gasto.fecha.split('T')[0],
          numero_comprobante: gasto.numero_comprobante || '',
          notas: gasto.notas || '',
          categoria_gasto_id: gasto.categorias_gasto.id,
          proveedor_id: gasto.proveedores?.id || '',
          pago_persona_id: gasto.personas?.id || '',
          metodo_pago_id: gasto.metodos_pago.id,
          estado_pago_id: gasto.estados_pago.id
        })
      } catch (error) {
        console.error('Error:', error)
        alert('Error al cargar los datos')
        router.push('/dashboard/gastos')
      } finally {
        setLoading(false)
      }
    }

    if (gastoId) {
      fetchData()
    }
  }, [gastoId, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.descripcion.trim() || !formData.monto || !formData.fecha) {
      alert('Por favor complete los campos obligatorios')
      return
    }

    setSaving(true)

    try {
      const response = await fetch('/api/gastos', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: gastoId,
          ...formData,
          monto: parseFloat(formData.monto),
          proveedor_id: formData.proveedor_id || null,
          pago_persona_id: formData.pago_persona_id || null,
          numero_comprobante: formData.numero_comprobante || null,
          notas: formData.notas || null
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar el gasto')
      }

      router.push('/dashboard/gastos')
    } catch (error) {
      console.error('Error:', error)
      alert(error instanceof Error ? error.message : 'Error al actualizar el gasto')
    } finally {
      setSaving(false)
    }
  }

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
            <h2 className="text-3xl font-bold tracking-tight">Editar Gasto</h2>
            <p className="text-gray-500">Cargando datos...</p>
          </div>
        </div>
        <Card className="max-w-4xl">
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
        <Link href="/dashboard/gastos">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Editar Gasto</h2>
          <p className="text-gray-500">
            Modifica los datos del gasto
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Información del Gasto</CardTitle>
          <CardDescription>
            Actualiza los datos del gasto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="fecha">Fecha *</Label>
                <Input
                  id="fecha"
                  name="fecha"
                  type="date"
                  value={formData.fecha}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="monto">Monto *</Label>
                <Input
                  id="monto"
                  name="monto"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.monto}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="descripcion">Descripción *</Label>
                <Input
                  id="descripcion"
                  name="descripcion"
                  type="text"
                  placeholder="Descripción del gasto"
                  value={formData.descripcion}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="categoria_gasto_id">Categoría *</Label>
                <Select
                  id="categoria_gasto_id"
                  name="categoria_gasto_id"
                  value={formData.categoria_gasto_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Seleccione una categoría</option>
                  {categorias.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="proveedor_id">Proveedor</Label>
                <Select
                  id="proveedor_id"
                  name="proveedor_id"
                  value={formData.proveedor_id}
                  onChange={handleChange}
                >
                  <option value="">Sin proveedor</option>
                  {proveedores.map((prov: any) => (
                    <option key={prov.id} value={prov.id}>
                      {prov.nombre}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="pago_persona_id">Persona *</Label>
                <Select
                  id="pago_persona_id"
                  name="pago_persona_id"
                  value={formData.pago_persona_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Seleccione una persona</option>
                  {personas.map((persona: any) => (
                    <option key={persona.id} value={persona.id}>
                      {persona.nombre}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="metodo_pago_id">Método de Pago *</Label>
                <Select
                  id="metodo_pago_id"
                  name="metodo_pago_id"
                  value={formData.metodo_pago_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Seleccione un método</option>
                  {metodos.map((metodo: any) => (
                    <option key={metodo.id} value={metodo.id}>
                      {metodo.nombre}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="estado_pago_id">Estado de Pago *</Label>
                <Select
                  id="estado_pago_id"
                  name="estado_pago_id"
                  value={formData.estado_pago_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Seleccione un estado</option>
                  {estados.map((estado: any) => (
                    <option key={estado.id} value={estado.id}>
                      {estado.nombre}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="numero_comprobante">N° Comprobante</Label>
                <Input
                  id="numero_comprobante"
                  name="numero_comprobante"
                  type="text"
                  placeholder="Número de comprobante"
                  value={formData.numero_comprobante}
                  onChange={handleChange}
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="notas">Notas</Label>
                <Textarea
                  id="notas"
                  name="notas"
                  placeholder="Notas adicionales..."
                  value={formData.notas}
                  onChange={handleChange}
                  rows={3}
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
              <Link href="/dashboard/gastos">
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