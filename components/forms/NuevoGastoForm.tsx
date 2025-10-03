'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from '@/components/ui/spinner'
import { Plus, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Props {
  proyecto: any
  categorias: any[]
  personas: any[]
  proveedores: any[]
  estados: any[]
  metodos: any[]
  avances: any[]
  estadoPagadoId?: string
  initialData?: any
  isEditing?: boolean
}

interface VinculacionAvance {
  avance_obra_id: string
  monto_asignado: number
  notas: string
}

export default function NuevoGastoForm({
  proyecto,
  categorias,
  personas,
  proveedores,
  estados,
  metodos,
  avances,
  estadoPagadoId,
  initialData,
  isEditing = false
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [vinculaciones, setVinculaciones] = useState<VinculacionAvance[]>(
    initialData?.gastos_avances_obra?.map((gao: any) => ({
      avance_obra_id: gao.avance_obra_id,
      monto_asignado: gao.monto_asignado,
      notas: gao.notas || ''
    })) || []
  )
  const [proveedoresList, setProveedoresList] = useState(proveedores)
  const [nuevoProveedor, setNuevoProveedor] = useState('')
  const [creandoProveedor, setCreandoProveedor] = useState(false)
  const [mostrarFormProveedor, setMostrarFormProveedor] = useState(false)

  // Estados para categorías
  const [categoriasList, setCategoriasList] = useState(categorias)
  const [nuevaCategoria, setNuevaCategoria] = useState('')
  const [creandoCategoria, setCreandoCategoria] = useState(false)
  const [mostrarFormCategoria, setMostrarFormCategoria] = useState(false)

  // Estados para personas
  const [personasList, setPersonasList] = useState(personas)
  const [nuevaPersona, setNuevaPersona] = useState('')
  const [creandoPersona, setCreandoPersona] = useState(false)
  const [mostrarFormPersona, setMostrarFormPersona] = useState(false)

  // Estados para métodos de pago
  const [metodosList, setMetodosList] = useState(metodos)
  const [nuevoMetodo, setNuevoMetodo] = useState('')
  const [creandoMetodo, setCreandoMetodo] = useState(false)
  const [mostrarFormMetodo, setMostrarFormMetodo] = useState(false)

  // Form data
  const [formData, setFormData] = useState({
    fecha: initialData?.fecha || new Date().toISOString().split('T')[0],
    descripcion: initialData?.descripcion || '',
    monto: initialData?.monto?.toString() || '',
    categoria_id: initialData?.categoria_gasto_id || '',
    proveedor_id: initialData?.proveedor_id || '',
    pago_persona_id: initialData?.pago_persona_id || '',
    estado_id: initialData?.estado_pago_id || estadoPagadoId || '',
    metodo_pago_id: initialData?.metodo_pago_id || '',
    numero_comprobante: initialData?.numero_comprobante || '',
    notas: initialData?.notas || ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const agregarVinculacion = () => {
    setVinculaciones(prev => [...prev, {
      avance_obra_id: '',
      monto_asignado: 0,
      notas: ''
    }])
  }

  const eliminarVinculacion = (index: number) => {
    setVinculaciones(prev => prev.filter((_, i) => i !== index))
  }

  const actualizarVinculacion = (index: number, field: string, value: any) => {
    setVinculaciones(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
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
        setProveedoresList(prev => [...prev, nuevoProveedorData])
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
        setCategoriasList(prev => [...prev, nuevaCategoriaData])
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
        setPersonasList(prev => [...prev, nuevaPersonaData])
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
        setMetodosList(prev => [...prev, nuevoMetodoData])
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
    
    // Validación básica
    if (!formData.fecha || !formData.descripcion || !formData.monto || !formData.categoria_id || !formData.pago_persona_id || !formData.estado_id) {
      alert('Por favor complete los campos obligatorios')
      return
    }

    const montoTotal = parseFloat(formData.monto)
    const montoVinculado = vinculaciones.reduce((sum, v) => sum + v.monto_asignado, 0)

    if (vinculaciones.length > 0 && Math.abs(montoTotal - montoVinculado) > 0.01) {
      alert(`El monto vinculado (${formatCurrency(montoVinculado)}) debe ser igual al monto total (${formatCurrency(montoTotal)})`)
      return
    }

    setLoading(true)

    try {
      const url = isEditing ? '/api/gastos' : '/api/gastos'
      const method = isEditing ? 'PUT' : 'POST'
      const body = isEditing
        ? { ...formData, id: initialData.id, vinculaciones }
        : { ...formData, vinculaciones }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...body,
          proyecto_obra_id: proyecto.id,
          monto: parseFloat(formData.monto),
        })
      })

      if (response.ok) {
        router.refresh()
        router.push('/dashboard/gastos')
      } else {
        const error = await response.json()
        alert('Error al guardar: ' + (error.error || 'Error desconocido'))
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al guardar el gasto')
    } finally {
      setLoading(false)
    }
  }

  const montoGasto = parseFloat(formData.monto) || 0
  const montoVinculado = vinculaciones.reduce((sum, v) => sum + v.monto_asignado, 0)
  const montoRestante = montoGasto - montoVinculado

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información básica */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Gasto</CardTitle>
          <CardDescription>
            Complete los datos del nuevo gasto. Los campos con * son obligatorios.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="fecha">Fecha *</Label>
              <Input
                id="fecha"
                name="fecha"
                type="date"
                value={formData.fecha}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="monto">Monto *</Label>
              <Input
                id="monto"
                name="monto"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.monto}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="descripcion">Descripción *</Label>
            <Textarea
              id="descripcion"
              name="descripcion"
              placeholder="Describa el gasto..."
              value={formData.descripcion}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="categoria_id">Categoría *</Label>
              <div className="space-y-2">
                <Select
                  id="categoria_id"
                  name="categoria_id"
                  value={formData.categoria_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Seleccione...</option>
                  {categoriasList.map(cat => (
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
                  onChange={handleInputChange}
                >
                  <option value="">Sin proveedor</option>
                  {proveedoresList.map(prov => (
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
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="pago_persona_id">Pagado por *</Label>
              <div className="space-y-2">
                <Select
                  id="pago_persona_id"
                  name="pago_persona_id"
                  value={formData.pago_persona_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Seleccione...</option>
                  {personasList.map(per => (
                    <option key={per.id} value={per.id}>
                      {per.nombre}
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
              <Label htmlFor="metodo_pago_id">Método de pago</Label>
              <div className="space-y-2">
                <Select
                  id="metodo_pago_id"
                  name="metodo_pago_id"
                  value={formData.metodo_pago_id}
                  onChange={handleInputChange}
                >
                  <option value="">Sin especificar</option>
                  {metodosList.map(met => (
                    <option key={met.id} value={met.id}>
                      {met.nombre}
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
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="estado_id">Estado *</Label>
              <Select
                id="estado_id"
                name="estado_id"
                value={formData.estado_id}
                onChange={handleInputChange}
                required
              >
                <option value="">Seleccione...</option>
                {estados.map(est => (
                  <option key={est.id} value={est.id}>
                    {est.nombre}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="numero_comprobante">Número de comprobante</Label>
              <Input
                id="numero_comprobante"
                name="numero_comprobante"
                type="text"
                placeholder="Factura/Recibo"
                value={formData.numero_comprobante}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notas">Notas adicionales</Label>
            <Textarea
              id="notas"
              name="notas"
              placeholder="Información adicional..."
              value={formData.notas}
              onChange={handleInputChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Vinculación con avances */}
      <Card>
        <CardHeader>
          <CardTitle>Vinculación con Avances de Obra</CardTitle>
          <CardDescription>
            Opcional: Asigne este gasto a items específicos del proyecto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {montoGasto > 0 && vinculaciones.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm">
                Monto del gasto: <strong>{formatCurrency(montoGasto)}</strong>
              </span>
              <span className="text-sm">
                Vinculado: <strong>{formatCurrency(montoVinculado)}</strong>
              </span>
              <Badge variant={Math.abs(montoRestante) < 0.01 ? 'success' : 'warning'}>
                Restante: {formatCurrency(montoRestante)}
              </Badge>
            </div>
          )}

          {vinculaciones.map((vinc, index) => (
            <div key={index} className="space-y-4 p-4 border rounded-lg">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium">Vinculación #{index + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => eliminarVinculacion(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Avance de obra</Label>
                  <Select
                    value={vinc.avance_obra_id}
                    onChange={(e) => actualizarVinculacion(index, 'avance_obra_id', e.target.value)}
                  >
                    <option value="">Seleccione...</option>
                    {avances.map(av => (
                      <option key={av.id} value={av.id}>
                        {av.descripcion}
                        {av.monto_presupuestado && ` - Presup: ${formatCurrency(av.monto_presupuestado)}`}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Label>Monto asignado</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={vinc.monto_asignado}
                    onChange={(e) => actualizarVinculacion(index, 'monto_asignado', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div>
                <Label>Notas</Label>
                <Input
                  placeholder="Notas sobre esta vinculación"
                  value={vinc.notas}
                  onChange={(e) => actualizarVinculacion(index, 'notas', e.target.value)}
                />
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={agregarVinculacion}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar vinculación con avance
          </Button>
        </CardContent>
      </Card>

      {/* Botones de acción */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
          className="w-full sm:w-auto order-2 sm:order-1"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto order-1 sm:order-2"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <span className="hidden sm:inline">Guardar Gasto</span>
          <span className="sm:hidden">Guardar</span>
        </Button>
      </div>
    </form>
  )
}
