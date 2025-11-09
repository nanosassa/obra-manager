'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, Mail, Shield, Calendar, CheckCircle2, XCircle, Clock } from 'lucide-react'
import EditarPerfilForm from '@/components/forms/EditarPerfilForm'
import CambiarPasswordForm from '@/components/forms/CambiarPasswordForm'
import { formatDate } from '@/lib/utils'

interface UserData {
  id: string
  name: string
  email: string
  role: string
  avatar_url: string | null
  oauth_provider: string | null
  proyecto_asignado_id: string | null
  activo: boolean
  aprobado: boolean
  created_at: string
  updated_at: string
}

const roleLabels: Record<string, string> = {
  super_admin: 'Super Administrador',
  admin: 'Administrador',
  project_manager: 'Jefe de Proyecto',
  contador: 'Contador',
  viewer: 'Visualizador'
}

const roleColors: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-800 border-purple-200',
  admin: 'bg-blue-100 text-blue-800 border-blue-200',
  project_manager: 'bg-green-100 text-green-800 border-green-200',
  contador: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  viewer: 'bg-gray-100 text-gray-800 border-gray-200'
}

export default function PerfilPage() {
  const { data: session } = useSession()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/users/me')
      if (response.ok) {
        const data = await response.json()
        setUserData(data)
      }
    } catch (error) {
      console.error('Error al cargar datos del usuario:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserData()
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">
          No se pudieron cargar los datos del perfil
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-gray-600 mt-2">
          Gestiona tu información personal y configuración de cuenta
        </p>
      </div>

      {/* Vista general del perfil */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Información de la Cuenta
          </CardTitle>
          <CardDescription>
            Detalles de tu cuenta en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white text-3xl font-semibold shadow-lg">
                {userData.name.charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Información */}
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Nombre</div>
                  <div className="text-base font-semibold text-gray-900">{userData.name}</div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Email</div>
                  <div className="text-base text-gray-900 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    {userData.email}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Rol</div>
                  <Badge className={roleColors[userData.role] || roleColors.viewer}>
                    <Shield className="h-3 w-3 mr-1" />
                    {roleLabels[userData.role] || userData.role}
                  </Badge>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Método de Autenticación</div>
                  <div className="text-base text-gray-900">
                    {userData.oauth_provider === 'google' ? (
                      <Badge className="bg-white text-gray-700 border border-gray-300">
                        <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Google
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-700 border border-gray-300">
                        Credenciales
                      </Badge>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Estado</div>
                  <div className="flex items-center gap-2">
                    {userData.activo ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Activo
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800 border-red-200">
                        <XCircle className="h-3 w-3 mr-1" />
                        Inactivo
                      </Badge>
                    )}
                    {userData.role === 'viewer' && (
                      userData.aprobado ? (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Aprobado
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                          <Clock className="h-3 w-3 mr-1" />
                          Pendiente
                        </Badge>
                      )
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Miembro desde</div>
                  <div className="text-base text-gray-900 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {formatDate(userData.created_at)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formularios de edición */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EditarPerfilForm
          user={{
            id: userData.id,
            name: userData.name,
            email: userData.email,
            role: userData.role,
            oauth_provider: userData.oauth_provider
          }}
          onSuccess={fetchUserData}
        />

        <CambiarPasswordForm isOAuthUser={userData.oauth_provider === 'google'} />
      </div>
    </div>
  )
}
