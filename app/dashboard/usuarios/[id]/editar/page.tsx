'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { ArrowLeft, Save } from 'lucide-react'

export default function EditarUsuarioPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [proyectos, setProyectos] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    proyecto_asignado_id: '',
    activo: true
  })

  // Verificar permisos
  useEffect(() => {
    if (status === 'authenticated' && session?.user.role !== 'super_admin' && session?.user.role !== 'admin') {
      router.push('/dashboard/usuarios')
    }
  }, [status, session, router])

  // Cargar usuario y proyectos
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userResponse, proyectosResponse] = await Promise.all([
          fetch(`/api/users/${userId}`),
          fetch('/api/proyectos')
        ])

        if (userResponse.ok) {
          const user = await userResponse.json()
          setFormData({
            name: user.name,
            email: user.email,
            role: user.role || 'viewer',
            proyecto_asignado_id: user.proyecto_asignado_id || '',
            activo: user.activo
          })
        }

        if (proyectosResponse.ok) {
          const proyectosData = await proyectosResponse.json()
          setProyectos(proyectosData)
        }
      } catch (error) {
        console.error('Error al cargar datos:', error)
        alert('Error al cargar datos del usuario')
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchData()
    }
  }, [userId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.email) {
      alert('Nombre y email son requeridos')
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          role: formData.role,
          proyecto_asignado_id: formData.proyecto_asignado_id || null,
          activo: formData.activo
        })
      })

      if (response.ok) {
        alert('Usuario actualizado exitosamente')
        router.push('/dashboard/usuarios')
      } else {
        const error = await response.json()
        alert(error.error || 'Error al actualizar usuario')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al actualizar usuario')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/usuarios">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Editar Usuario</h2>
          <p className="text-gray-500">
            Modificar información del usuario
          </p>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Información del Usuario</CardTitle>
            <CardDescription>
              Actualiza los datos del usuario
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nombre */}
              <div>
                <Label htmlFor="name">Nombre Completo *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Juan Pérez"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="juan@ejemplo.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Rol */}
              <div>
                <Label htmlFor="role">Rol *</Label>
                <Select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                >
                  <option value="viewer">Viewer (Solo lectura)</option>
                  <option value="contador">Contador</option>
                  <option value="pm">Project Manager</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </Select>
              </div>

              {/* Proyecto Asignado (solo para PM) */}
              {formData.role === 'pm' && (
                <div>
                  <Label htmlFor="proyecto_asignado_id">Proyecto Asignado</Label>
                  <Select
                    id="proyecto_asignado_id"
                    name="proyecto_asignado_id"
                    value={formData.proyecto_asignado_id}
                    onChange={handleChange}
                  >
                    <option value="">Sin asignar</option>
                    {proyectos.map(proyecto => (
                      <option key={proyecto.id} value={proyecto.id}>
                        {proyecto.nombre}
                      </option>
                    ))}
                  </Select>
                </div>
              )}

              {/* Estado */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="activo"
                  name="activo"
                  checked={formData.activo}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <Label htmlFor="activo" className="cursor-pointer">
                  Usuario Activo
                </Label>
              </div>
            </div>

            {/* Información */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">⚠️ Cambio de Contraseña</h4>
              <p className="text-sm text-yellow-800">
                Para cambiar la contraseña del usuario, este debe usar la función "Cambiar Contraseña"
                desde su perfil después de iniciar sesión.
              </p>
            </div>

            {/* Botones */}
            <div className="flex gap-4 justify-end">
              <Link href="/dashboard/usuarios">
                <Button type="button" variant="outline" disabled={saving}>
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
