'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save, Plus } from "lucide-react"
import { Loader2 } from '@/components/ui/spinner'
import Link from "next/link"
import VinculacionesEditor, { type Vinculacion } from "@/components/forms/VinculacionesEditor"

interface FormData {
  descripcion: string
  monto: string
  fecha: string
  numero_comprobante: string
  notas: string
  categoria_id: string
  proveedor_id: string
  pago_persona_id: string
  metodo_pago_id: string
  estado_id: string
}

export default function EditarGastoPage() {
  const router = useRouter()
  const params = useParams()
  const gastoId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categorias, setCategorias] = useState<any[]>([])
  const [proveedores, setProveedores] = useState<any[]>([])
  const [personas, setPersonas] = useState<any[]>([])
  const [metodos, setMetodos] = useState<any[]>([])
  const [estados, setEstados] = useState<any[]>([])
  const [avances, setAvances] = useState<any[]>([])
  const [vinculaciones, setVinculaciones] = useState<Vinculacion[]>([])
  const [nuevoProveedor, setNuevoProveedor] = useState('')
  const [creandoProveedor, setCreandoProveedor] = useState(false)
  const [mostrarFormProveedor, setMostrarFormProveedor] = useState(false)

  // Estados para categorías
  const [nuevaCategoria, setNuevaCategoria] = useState('')
  const [creandoCategoria, setCreandoCategoria] = useState(false)
  const [mostrarFormCategoria, setMostrarFormCategoria] = useState(false)

  // Estados para personas
  const [nuevaPersona, setNuevaPersona] = useState('')
  const [creandoPersona, setCreandoPersona] = useState(false)
  const [mostrarFormPersona, setMostrarFormPersona] = useState(false)

  // Estados para métodos de pago
  const [nuevoMetodo, setNuevoMetodo] = useState('')
  const [creandoMetodo, setCreandoMetodo] = useState(false)
  const [mostrarFormMetodo, setMostrarFormMetodo] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    descripcion: '',
    monto: '',
    fecha: '',
    numero_comprobante: '',
    notas: '',
    categoria_id: '',
    proveedor_id: '',
    pago_persona_id: '',
    metodo_pago_id: '',
    estado_id: ''
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
        setAvances(datos.avances || [])

        // Configurar datos del gasto
        setFormData({
          descripcion: gasto.descripcion,
          monto: gasto.monto.toString(),
          fecha: gasto.fecha.split('T')[0],
          numero_comprobante: gasto.numero_comprobante || '',
          notas: gasto.notas || '',
          categoria_id: gasto.categoria_id,
          proveedor_id: gasto.proveedor_id || '',
          pago_persona_id: gasto.pago_persona_id || '',
          metodo_pago_id: gasto.metodo_pago_id || '',
          estado_id: gasto.estado_id
        })

        // Configurar vinculaciones existentes
        if (gasto.gastos_avances_obra && gasto.gastos_avances_obra.length > 0) {
          setVinculaciones(
            gasto.gastos_avances_obra.map((gao: any) => ({
              id: gao.id,
              avance_obra_id: gao.avance_obra_id,
              monto_asignado: Number(gao.monto_asignado), // Asegurar conversión a número
              notas: gao.notas || ''
            }))
          )
        }
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

  const crearProveedor = async () => {
    if (!nuevoProveedor.trim()) return

    setCreandoProveedor(true)
    try {
      const response = await fetch('/api/proveedores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nuevoProveedor.trim()
        })
      })

      if (response.ok) {
        const nuevoProveedorData = await response.json()
        setProveedores(prev => [...prev, nuevoProveedorData])
        setFormData(prev => ({ ...prev, proveedor_id: nuevoProveedorData.id }))
        setNuevoProveedor('')
        setMostrarFormProveedor(false)
      } else {
        alert('Error al crear el proveedor')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al crear el proveedor')
    } finally {
      setCreandoProveedor(false)
    }
  }

  const crearCategoria = async () => {
    if (!nuevaCategoria.trim()) return

    setCreandoCategoria(true)
    try {
      const response = await fetch('/api/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nuevaCategoria.trim()
        })
      })

      if (response.ok) {
        const nuevaCategoriaData = await response.json()
        setCategorias(prev => [...prev, nuevaCategoriaData])
        setFormData(prev => ({ ...prev, categoria_id: nuevaCategoriaData.id }))
        setNuevaCategoria('')
        setMostrarFormCategoria(false)
      } else {
        alert('Error al crear la categoría')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al crear la categoría')
    } finally {
      setCreandoCategoria(false)
    }
  }

  const crearPersona = async () => {
    if (!nuevaPersona.trim()) return

    setCreandoPersona(true)
    try {
      const response = await fetch('/api/personas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nuevaPersona.trim()
        })
      })

      if (response.ok) {
        const nuevaPersonaData = await response.json()
        setPersonas(prev => [...prev, nuevaPersonaData])
        setFormData(prev => ({ ...prev, pago_persona_id: nuevaPersonaData.id }))
        setNuevaPersona('')
        setMostrarFormPersona(false)
      } else {
        alert('Error al crear la persona')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al crear la persona')
    } finally {
      setCreandoPersona(false)
    }
  }

  const crearMetodo = async () => {
    if (!nuevoMetodo.trim()) return

    setCreandoMetodo(true)
    try {
      const response = await fetch('/api/metodos-pago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nuevoMetodo.trim()
        })
      })

      if (response.ok) {
        const nuevoMetodoData = await response.json()
        setMetodos(prev => [...prev, nuevoMetodoData])
        setFormData(prev => ({ ...prev, metodo_pago_id: nuevoMetodoData.id }))
        setNuevoMetodo('')
        setMostrarFormMetodo(false)
      } else {
        alert('Error al crear el método de pago')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al crear el método de pago')
    } finally {
      setCreandoMetodo(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.descripcion.trim() || !formData.monto || !formData.fecha) {
      alert('Por favor complete los campos obligatorios')
      return
    }

    // Validar vinculaciones
    const montoGasto = parseFloat(formData.monto) || 0
    const vinculacionesActivas = vinculaciones.filter(v => !v._toDelete)
    const totalVinculado = vinculacionesActivas.reduce((sum, v) => sum + (parseFloat(String(v.monto_asignado)) || 0), 0)

    if (vinculacionesActivas.length > 0 && Math.abs(montoGasto - totalVinculado) > 0.01) {
      alert(
        `El monto total del gasto ($${montoGasto.toFixed(2)}) debe coincidir con la suma de vinculaciones ($${totalVinculado.toFixed(2)}). ` +
        `Diferencia: $${(montoGasto - totalVinculado).toFixed(2)}`
      )
      return
    }

    // Validar que todas las vinculaciones tengan avance seleccionado
    const vinculacionesInvalidas = vinculacionesActivas.filter(v => !v.avance_obra_id || v.monto_asignado <= 0)
    if (vinculacionesInvalidas.length > 0) {
      alert('Todas las vinculaciones deben tener un avance y un monto mayor a 0')
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
          monto: montoGasto,
          proveedor_id: formData.proveedor_id || null,
          pago_persona_id: formData.pago_persona_id || null,
          numero_comprobante: formData.numero_comprobante || null,
          notas: formData.notas || null,
          vinculaciones: vinculaciones
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar el gasto')
      }

      router.refresh()
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
                <Label htmlFor="categoria_id">Categoría *</Label>
                <div className="space-y-2">
                  <Select
                    id="categoria_id"
                    name="categoria_id"
                    value={formData.categoria_id}
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

                  {!mostrarFormCategoria ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setMostrarFormCategoria(true)}
                      className="w-full text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Crear nueva categoría
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        placeholder="Nombre de la categoría"
                        value={nuevaCategoria}
                        onChange={(e) => setNuevaCategoria(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            crearCategoria()
                          }
                          if (e.key === 'Escape') {
                            setMostrarFormCategoria(false)
                            setNuevaCategoria('')
                          }
                        }}
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={crearCategoria}
                          disabled={creandoCategoria || !nuevaCategoria.trim()}
                          className="flex-1"
                        >
                          {creandoCategoria && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                          Crear
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setMostrarFormCategoria(false)
                            setNuevaCategoria('')
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="proveedor_id">Proveedor</Label>
                <div className="space-y-2">
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

                  {!mostrarFormProveedor ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setMostrarFormProveedor(true)}
                      className="w-full text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Crear nuevo proveedor
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        placeholder="Nombre del proveedor"
                        value={nuevoProveedor}
                        onChange={(e) => setNuevoProveedor(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            crearProveedor()
                          }
                          if (e.key === 'Escape') {
                            setMostrarFormProveedor(false)
                            setNuevoProveedor('')
                          }
                        }}
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={crearProveedor}
                          disabled={creandoProveedor || !nuevoProveedor.trim()}
                          className="flex-1"
                        >
                          {creandoProveedor && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                          Crear
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setMostrarFormProveedor(false)
                            setNuevoProveedor('')
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="pago_persona_id">Persona *</Label>
                <div className="space-y-2">
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

                  {!mostrarFormPersona ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setMostrarFormPersona(true)}
                      className="w-full text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Crear nueva persona
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        placeholder="Nombre de la persona"
                        value={nuevaPersona}
                        onChange={(e) => setNuevaPersona(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            crearPersona()
                          }
                          if (e.key === 'Escape') {
                            setMostrarFormPersona(false)
                            setNuevaPersona('')
                          }
                        }}
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={crearPersona}
                          disabled={creandoPersona || !nuevaPersona.trim()}
                          className="flex-1"
                        >
                          {creandoPersona && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                          Crear
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setMostrarFormPersona(false)
                            setNuevaPersona('')
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="metodo_pago_id">Método de Pago</Label>
                <div className="space-y-2">
                  <Select
                    id="metodo_pago_id"
                    name="metodo_pago_id"
                    value={formData.metodo_pago_id}
                    onChange={handleChange}
                  >
                    <option value="">Seleccione un método</option>
                    {metodos.map((metodo: any) => (
                      <option key={metodo.id} value={metodo.id}>
                        {metodo.nombre}
                      </option>
                    ))}
                  </Select>

                  {!mostrarFormMetodo ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setMostrarFormMetodo(true)}
                      className="w-full text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Crear nuevo método
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        placeholder="Nombre del método de pago"
                        value={nuevoMetodo}
                        onChange={(e) => setNuevoMetodo(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            crearMetodo()
                          }
                          if (e.key === 'Escape') {
                            setMostrarFormMetodo(false)
                            setNuevoMetodo('')
                          }
                        }}
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={crearMetodo}
                          disabled={creandoMetodo || !nuevoMetodo.trim()}
                          className="flex-1"
                        >
                          {creandoMetodo && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                          Crear
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setMostrarFormMetodo(false)
                            setNuevoMetodo('')
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="estado_id">Estado de Pago *</Label>
                <Select
                  id="estado_id"
                  name="estado_id"
                  value={formData.estado_id}
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
          </form>
        </CardContent>
      </Card>

      {/* Editor de Vinculaciones */}
      <VinculacionesEditor
        montoGasto={parseFloat(formData.monto) || 0}
        vinculaciones={vinculaciones}
        onChange={setVinculaciones}
        avances={avances}
      />

      {/* Form container con botones */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit}>
            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <Link href="/dashboard/gastos" className="order-2 sm:order-1 w-full sm:w-auto">
                <Button type="button" variant="outline" className="w-full">
                  Cancelar
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto order-1 sm:order-2"
              >
                <Save className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
                <span className="sm:hidden">{saving ? 'Guardando...' : 'Guardar'}</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
