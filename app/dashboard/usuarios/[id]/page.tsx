'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit, Mail, Calendar, CheckCircle, XCircle } from 'lucide-react'
import RoleBadge from '@/components/users/RoleBadge'
import { formatDate } from '@/lib/utils'

export default function VerUsuarioPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/users/${userId}`)
        if (response.ok) {
          const data = await response.json()
          setUser(data)
        } else if (response.status === 403) {
          alert('No tienes permisos para ver este usuario')
          router.push('/dashboard/usuarios')
        }
      } catch (error) {
        console.error('Error al cargar usuario:', error)
        alert('Error al cargar usuario')
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchUser()
    }
  }, [userId, router])

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-8">
        <p className="text-red-500">Usuario no encontrado</p>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/usuarios">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Perfil de Usuario</h2>
            <p className="text-gray-500">
              Información detallada del usuario
            </p>
          </div>
        </div>
        {session?.user.role === 'super_admin' && (
          <Link href={`/dashboard/usuarios/${userId}/editar`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>
        )}
      </div>

      {/* Información del Usuario */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white text-2xl font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <CardTitle className="text-2xl">{user.name}</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <RoleBadge role={user.role} />
                  {user.activo ? (
                    <Badge variant="success" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Activo
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <XCircle className="h-3 w-3" />
                      Inactivo
                    </Badge>
                  )}
                  {user.oauth_provider && (
                    <Badge variant="outline">
                      OAuth: {user.oauth_provider}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-gray-600">
                <Mail className="h-5 w-5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-gray-600">
                <Calendar className="h-5 w-5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Fecha de Creación</p>
                  <p className="font-medium text-gray-900">{formatDate(user.created_at)}</p>
                </div>
              </div>

              {user.updated_at && (
                <div className="flex items-center gap-3 text-gray-600">
                  <Calendar className="h-5 w-5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Última Actualización</p>
                    <p className="font-medium text-gray-900">{formatDate(user.updated_at)}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {user.proyecto_asignado_id && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Proyecto Asignado</p>
                  <Badge variant="outline" className="text-sm">
                    {user.proyecto_asignado_id}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permisos según Rol */}
      <Card>
        <CardHeader>
          <CardTitle>Permisos del Rol</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {user.role === 'super_admin' && (
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Acceso total al sistema</li>
                <li>Gestionar usuarios y roles</li>
                <li>Ver y editar todos los proyectos</li>
                <li>Configuración del sistema</li>
              </ul>
            )}
            {user.role === 'admin' && (
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Ver y editar todos los gastos y avances</li>
                <li>Crear/editar proveedores y categorías</li>
                <li>Ver reportes completos</li>
                <li>No puede gestionar usuarios</li>
              </ul>
            )}
            {user.role === 'pm' && (
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Ver y editar gastos del proyecto asignado</li>
                <li>Ver y editar avances del proyecto asignado</li>
                <li>Ver reportes del proyecto asignado</li>
                <li>Crear proveedores y personas</li>
              </ul>
            )}
            {user.role === 'contador' && (
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Ver todos los gastos y reportes</li>
                <li>Editar estados de pago</li>
                <li>Exportar reportes</li>
                <li>No puede crear/editar avances de obra</li>
              </ul>
            )}
            {user.role === 'viewer' && (
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Solo lectura en todo el sistema</li>
                <li>Ver gastos, avances y reportes</li>
                <li>No puede crear, editar ni eliminar</li>
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
