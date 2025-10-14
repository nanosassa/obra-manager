'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface UsuarioPendiente {
  id: string
  name: string
  email: string
  role: string
  created_at: string
}

export default function UsuariosPendientesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [usuarios, setUsuarios] = useState<UsuarioPendiente[]>([])
  const [loading, setLoading] = useState(true)

  // Verificar permisos
  useEffect(() => {
    if (status === 'authenticated' && session?.user.role !== 'super_admin' && session?.user.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [status, session, router])

  // Cargar usuarios pendientes
  useEffect(() => {
    fetchUsuariosPendientes()
  }, [])

  const fetchUsuariosPendientes = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/users/pendientes')
      if (response.ok) {
        const data = await response.json()
        setUsuarios(data)
      }
    } catch (error) {
      console.error('Error al cargar usuarios pendientes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAprobar = async (userId: string, userName: string) => {
    if (!confirm(`¿Aprobar al usuario "${userName}"?\n\nPodrá acceder al sistema como Viewer.`)) {
      return
    }

    try {
      const response = await fetch(`/api/users/${userId}/aprobar`, {
        method: 'POST'
      })

      if (response.ok) {
        alert('✅ Usuario aprobado exitosamente')
        fetchUsuariosPendientes()
      } else {
        const error = await response.json()
        alert(error.error || 'Error al aprobar usuario')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al aprobar usuario')
    }
  }

  const handleRechazar = async (userId: string, userName: string) => {
    if (!confirm(`¿Rechazar al usuario "${userName}"?\n\n⚠️ Esta acción eliminará permanentemente la cuenta.`)) {
      return
    }

    try {
      const response = await fetch(`/api/users/${userId}/rechazar`, {
        method: 'POST'
      })

      if (response.ok) {
        alert('Usuario rechazado y eliminado')
        fetchUsuariosPendientes()
      } else {
        const error = await response.json()
        alert(error.error || 'Error al rechazar usuario')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al rechazar usuario')
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
          <h2 className="text-3xl font-bold tracking-tight">Usuarios Pendientes</h2>
          <p className="text-gray-500">
            Usuarios registrados esperando aprobación
          </p>
        </div>
      </div>

      {/* Info Card */}
      {usuarios.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-blue-900">
                  Tienes {usuarios.length} {usuarios.length === 1 ? 'usuario pendiente' : 'usuarios pendientes'} de aprobación
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Revisa las solicitudes y aprueba o rechaza según corresponda
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Solicitudes de Registro</CardTitle>
          <CardDescription>
            {usuarios.length === 0
              ? 'No hay usuarios pendientes de aprobación'
              : `${usuarios.length} ${usuarios.length === 1 ? 'solicitud pendiente' : 'solicitudes pendientes'}`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usuarios.length === 0 ? (
            <div className="text-center py-12">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ¡Todo al día!
              </h3>
              <p className="text-gray-600">
                No hay usuarios pendientes de aprobación en este momento
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Fecha Registro</TableHead>
                    <TableHead>Tiempo Esperando</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuarios.map((usuario) => {
                    const fechaRegistro = new Date(usuario.created_at)
                    const horasEspera = Math.floor((Date.now() - fechaRegistro.getTime()) / (1000 * 60 * 60))
                    const diasEspera = Math.floor(horasEspera / 24)

                    return (
                      <TableRow key={usuario.id} className="bg-yellow-50/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-yellow-600 to-yellow-700 text-white font-semibold">
                              {usuario.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{usuario.name}</p>
                              <Badge variant="warning" className="mt-1 text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                Pendiente
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{usuario.email}</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {formatDate(usuario.created_at)}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {diasEspera > 0
                              ? `${diasEspera} ${diasEspera === 1 ? 'día' : 'días'}`
                              : `${horasEspera} ${horasEspera === 1 ? 'hora' : 'horas'}`
                            }
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleAprobar(usuario.id, usuario.name)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Aprobar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRechazar(usuario.id, usuario.name)}
                              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Rechazar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
