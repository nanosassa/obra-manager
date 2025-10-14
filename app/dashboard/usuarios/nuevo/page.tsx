'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { ArrowLeft, Save, Eye, EyeOff } from 'lucide-react'

export default function NuevoUsuarioPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [proyectos, setProyectos] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'viewer',
    proyecto_asignado_id: ''
  })

  // Verificar permisos
  useEffect(() => {
    if (status === 'authenticated' && session?.user.role !== 'super_admin' && session?.user.role !== 'admin') {
      router.push('/dashboard/usuarios')
    }
  }, [status, session, router])

  // Cargar proyectos
  useEffect(() => {
    const fetchProyectos = async () => {
      try {
        const response = await fetch('/api/proyectos')
        if (response.ok) {
          const data = await response.json()
          setProyectos(data)
        }
      } catch (error) {
        console.error('Error al cargar proyectos:', error)
      }
    }
    fetchProyectos()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validaciones
    if (!formData.name || !formData.email || !formData.password) {
      alert('Nombre, email y contraseña son requeridos')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      alert('Las contraseñas no coinciden')
      return
    }

    if (formData.password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setSaving(true)

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          proyecto_asignado_id: formData.proyecto_asignado_id || null
        })
      })

      if (response.ok) {
        const user = await response.json()
        alert(`Usuario creado exitosamente!\n\nEmail: ${user.email}\nContraseña: ${formData.password}\n\n⚠️ Guarda estas credenciales, la contraseña no se podrá recuperar.`)
        router.push('/dashboard/usuarios')
      } else {
        const error = await response.json()
        alert(error.error || 'Error al crear usuario')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al crear usuario')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading') {
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
          <h2 className="text-3xl font-bold tracking-tight">Nuevo Usuario</h2>
          <p className="text-gray-500">
            Crear un nuevo usuario en el sistema
          </p>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Información del Usuario</CardTitle>
            <CardDescription>
              Completa los datos del nuevo usuario
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

              {/* Contraseña */}
              <div>
                <Label htmlFor="password">Contraseña *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirmar Contraseña */}
              <div>
                <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Repite la contraseña"
                  value={formData.confirmPassword}
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
                <p className="text-xs text-gray-500 mt-1">
                  Define los permisos del usuario en el sistema
                </p>
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
                  <p className="text-xs text-gray-500 mt-1">
                    Project Managers solo pueden ver el proyecto asignado
                  </p>
                </div>
              )}
            </div>

            {/* Información */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">ℹ️ Información Importante</h4>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>La contraseña temporal se mostrará una sola vez después de crear el usuario</li>
                <li>El usuario deberá cambiar su contraseña en el primer inicio de sesión</li>
                <li>Asegúrate de compartir las credenciales de forma segura</li>
              </ul>
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
                    Creando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Crear Usuario
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
