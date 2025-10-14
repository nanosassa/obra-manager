'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Search, Edit, Trash2, UserCircle, CheckCircle, XCircle, Clock } from 'lucide-react'
import RoleBadge from '@/components/users/RoleBadge'
import { formatDate } from '@/lib/utils'

interface User {
  id: string
  name: string
  email: string
  role: string
  activo: boolean
  created_at: string
  oauth_provider?: string
}

export default function UsuariosPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    busqueda: '',
    role: '',
    activo: ''
  })

  // Verificar permisos
  useEffect(() => {
    if (status === 'authenticated' && session?.user.role !== 'super_admin' && session?.user.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [status, session, router])

  // Cargar usuarios
  useEffect(() => {
    fetchUsers()
  }, [filters])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.busqueda) params.append('busqueda', filters.busqueda)
      if (filters.role) params.append('role', filters.role)
      if (filters.activo !== '') params.append('activo', filters.activo)

      const response = await fetch(`/api/users?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`¿Estás seguro de eliminar al usuario "${userName}"?\n\nEsta acción marcará el usuario como inactivo.`)) {
      return
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('Usuario eliminado exitosamente')
        fetchUsers()
      } else {
        const error = await response.json()
        alert(error.error || 'Error al eliminar usuario')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al eliminar usuario')
    }
  }

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Usuarios</h2>
          <p className="text-gray-500">
            Gestión de usuarios del sistema
          </p>
        </div>
        {(session?.user.role === 'super_admin' || session?.user.role === 'admin') && (
          <div className="flex gap-2">
            <Link href="/dashboard/usuarios/pendientes">
              <Button variant="outline">
                <Clock className="h-4 w-4 mr-2" />
                Pendientes
              </Button>
            </Link>
            <Link href="/dashboard/usuarios/nuevo">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Usuario
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Búsqueda</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nombre o email..."
                  value={filters.busqueda}
                  onChange={(e) => handleFilterChange('busqueda', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Rol</label>
              <Select
                value={filters.role}
                onChange={(e) => handleFilterChange('role', e.target.value)}
              >
                <option value="">Todos los roles</option>
                <option value="super_admin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="pm">Project Manager</option>
                <option value="contador">Contador</option>
                <option value="viewer">Viewer</option>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Estado</label>
              <Select
                value={filters.activo}
                onChange={(e) => handleFilterChange('activo', e.target.value)}
              >
                <option value="">Todos</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
          <CardDescription>
            {users.length} usuarios encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha Creación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No hay usuarios para mostrar
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id} className={!user.activo ? 'bg-gray-50 opacity-60' : ''}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white font-semibold">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            {user.oauth_provider && (
                              <Badge variant="outline" className="text-xs mt-1">
                                {user.oauth_provider}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <RoleBadge role={user.role} />
                      </TableCell>
                      <TableCell>
                        {user.activo ? (
                          <Badge variant="success" className="flex items-center gap-1 w-fit">
                            <CheckCircle className="h-3 w-3" />
                            Activo
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                            <XCircle className="h-3 w-3" />
                            Inactivo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDate(user.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/dashboard/usuarios/${user.id}`}>
                            <Button variant="ghost" size="sm">
                              <UserCircle className="h-4 w-4" />
                            </Button>
                          </Link>
                          {(session?.user.role === 'super_admin' || session?.user.role === 'admin') && (
                            <>
                              <Link href={`/dashboard/usuarios/${user.id}/editar`}>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
                              {session.user.id !== user.id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(user.id, user.name)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
