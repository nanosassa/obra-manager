'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Plus, Search, Edit, Trash2, X, Users, CheckCircle, XCircle } from 'lucide-react'
import { hasPermission, type UserRole } from '@/lib/permissions'
import { formatDate } from '@/lib/utils'

interface Persona {
  id: string
  nombre: string
  apellido: string | null
  email: string | null
  telefono: string | null
  activo: boolean
  created_at: string
}

const emptyForm = {
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
}

export default function PersonasPage() {
  const { data: session } = useSession()
  const role = session?.user?.role as UserRole | undefined
  const [personas, setPersonas] = useState<Persona[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const canCreatePers = hasPermission(role, 'personas:create')
  const canUpdatePers = hasPermission(role, 'personas:update')
  const canDeletePers = hasPermission(role, 'personas:delete')

  useEffect(() => {
    fetchPersonas()
  }, [])

  const fetchPersonas = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/personas')
      if (response.ok) {
        setPersonas(await response.json())
      }
    } catch (err) {
      console.error('Error al cargar personas:', err)
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditingId(null)
    setFormData(emptyForm)
    setError('')
    setShowModal(true)
  }

  const openEdit = (p: Persona) => {
    setEditingId(p.id)
    setFormData({
      nombre: p.nombre,
      apellido: p.apellido || '',
      email: p.email || '',
      telefono: p.telefono || '',
    })
    setError('')
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formData.nombre.trim()) {
      setError('El nombre es obligatorio')
      return
    }
    setSaving(true)
    setError('')
    try {
      const url = editingId ? `/api/personas/${editingId}` : '/api/personas'
      const method = editingId ? 'PUT' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (response.ok) {
        setShowModal(false)
        fetchPersonas()
      } else {
        const data = await response.json()
        setError(data.error || 'Error al guardar')
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar la persona "${nombre}"?`)) return
    try {
      const response = await fetch(`/api/personas/${id}`, { method: 'DELETE' })
      if (response.ok) {
        fetchPersonas()
      } else {
        const data = await response.json()
        alert(data.error || 'Error al eliminar')
      }
    } catch {
      alert('Error de conexión')
    }
  }

  const filtered = personas.filter(p => {
    if (!busqueda) return true
    const q = busqueda.toLowerCase()
    const fullName = `${p.nombre} ${p.apellido || ''}`.toLowerCase()
    return fullName.includes(q)
      || p.email?.toLowerCase().includes(q)
      || p.telefono?.includes(q)
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Personas</h2>
          <p className="text-gray-500">Gestión de personas del proyecto</p>
        </div>
        {canCreatePers && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Persona
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold">{personas.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Activas</p>
                <p className="text-2xl font-bold">{personas.filter(p => p.activo).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <XCircle className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Inactivas</p>
                <p className="text-2xl font-bold">{personas.filter(p => !p.activo).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre, apellido, email, teléfono..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Personas</CardTitle>
          <CardDescription>{filtered.length} personas encontradas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Creado</TableHead>
                  {(canUpdatePers || canDeletePers) && <TableHead className="text-right">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No hay personas para mostrar
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p) => (
                    <TableRow key={p.id} className={!p.activo ? 'bg-gray-50 opacity-60' : ''}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white font-semibold text-sm">
                            {p.nombre.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{p.nombre} {p.apellido || ''}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{p.email || '-'}</TableCell>
                      <TableCell className="text-sm">{p.telefono || '-'}</TableCell>
                      <TableCell>
                        {p.activo ? (
                          <Badge variant="success" className="flex items-center gap-1 w-fit">
                            <CheckCircle className="h-3 w-3" /> Activa
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                            <XCircle className="h-3 w-3" /> Inactiva
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">{formatDate(p.created_at)}</TableCell>
                      {(canUpdatePers || canDeletePers) && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {canUpdatePers && (
                              <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {canDeletePers && (
                              <Button
                                variant="ghost" size="sm"
                                onClick={() => handleDelete(p.id, p.nombre)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">
                {editingId ? 'Editar Persona' : 'Nueva Persona'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Nombre *</label>
                  <Input
                    value={formData.nombre}
                    onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Nombre"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Apellido</label>
                  <Input
                    value={formData.apellido}
                    onChange={(e) => setFormData(prev => ({ ...prev, apellido: e.target.value }))}
                    placeholder="Apellido"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@ejemplo.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Teléfono</label>
                <Input
                  value={formData.telefono}
                  onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                  placeholder="Teléfono"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando...' : editingId ? 'Guardar Cambios' : 'Crear Persona'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
