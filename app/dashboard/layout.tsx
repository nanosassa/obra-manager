'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { signOut, useSession } from 'next-auth/react'
import {
  Home,
  DollarSign,
  TrendingUp,
  FileText,
  Settings,
  Users,
  Package,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  Clock,
  LogOut,
  User
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Gastos', href: '/dashboard/gastos', icon: DollarSign },
  { name: 'Avances de Obra', href: '/dashboard/avances', icon: TrendingUp },
  {
    name: 'Reportes',
    href: '/dashboard/reportes',
    icon: FileText,
    submenu: [
      { name: 'Resumen General', href: '/dashboard/reportes', icon: FileText },
      { name: 'Por Categoría', href: '/dashboard/reportes/categorias', icon: FileText },
      { name: 'Gastos Pendientes', href: '/dashboard/gastos/pendientes', icon: Clock },
    ]
  },
  { name: 'Proveedores', href: '/dashboard/proveedores', icon: Package },
  { name: 'Personas', href: '/dashboard/personas', icon: Users },
  {
    name: 'Usuarios',
    href: '/dashboard/usuarios',
    icon: Users,
    adminOnly: true,
    showBadge: true  // Mostrar badge de pendientes
  },
  { name: 'Configuración', href: '/dashboard/configuracion', icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50/30">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-xl">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <SidebarContent pathname={pathname} onNavigate={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <SidebarContent pathname={pathname} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden bg-white/80 backdrop-blur-sm border-b border-gray-200/60 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              type="button"
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              🏗️ Obra Manager
            </h1>
            <div className="w-10" /> {/* Spacer */}
          </div>
        </div>

        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50/50 to-gray-100/30">
          {children}
        </main>
      </div>
    </div>
  )
}

function SidebarContent({ pathname, onNavigate }: { pathname: string, onNavigate?: () => void }) {
  const { data: session } = useSession()
  const [openSubmenus, setOpenSubmenus] = useState<string[]>(['Reportes']) // Reportes abierto por defecto
  const [pendientesCount, setPendientesCount] = useState(0)

  const toggleSubmenu = (itemName: string) => {
    setOpenSubmenus(prev =>
      prev.includes(itemName)
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    )
  }

  // Cargar usuarios pendientes si es admin
  useEffect(() => {
    const fetchPendientes = async () => {
      if (session?.user.role === 'super_admin' || session?.user.role === 'admin') {
        try {
          const response = await fetch('/api/users/pendientes')
          if (response.ok) {
            const data = await response.json()
            setPendientesCount(data.length)
          }
        } catch (error) {
          console.error('Error al cargar pendientes:', error)
        }
      }
    }

    fetchPendientes()
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchPendientes, 30000)
    return () => clearInterval(interval)
  }, [session])

  // Filtrar navegación según permisos
  const filteredNavigation = navigation.filter(item => {
    // Si el item requiere admin, verificar rol
    if ('adminOnly' in item && item.adminOnly) {
      return session?.user.role === 'super_admin' || session?.user.role === 'admin'
    }
    return true
  })

  return (
    <div className="flex flex-col flex-grow pt-6 overflow-y-auto bg-white shadow-lg border-r border-gray-200/60">
      <div className="flex items-center flex-shrink-0 px-6">
        <h1 className="text-xl font-bold text-gray-900">
          🏗️ Obra Manager
        </h1>
      </div>

      <div className="px-6 mt-8">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Proyecto
        </div>
        <div className="mt-2 text-sm font-semibold text-gray-900 bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
          Habitación Nuestra
        </div>
      </div>

      <div className="mt-8 flex-1 flex flex-col">
        <nav className="flex-1 px-4 space-y-1">
          {filteredNavigation.map((item) => {
            const Icon = item.icon
            const hasSubmenu = 'submenu' in item
            const isSubmenuOpen = openSubmenus.includes(item.name)

            // Para items con submenu, verificar si algún submenu está activo
            const isActive = hasSubmenu
              ? item.submenu?.some(sub => pathname === sub.href || (sub.href !== '/dashboard' && pathname.startsWith(sub.href)))
              : pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))

            return (
              <div key={item.name}>
                {hasSubmenu ? (
                  <button
                    onClick={() => toggleSubmenu(item.name)}
                    className={cn(
                      isActive
                        ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 shadow-sm border-r-4 border-blue-600'
                        : 'text-gray-700 hover:bg-gray-50/80 hover:text-gray-900',
                      'w-full group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ease-out'
                    )}
                  >
                    <Icon
                      className={cn(
                        isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600',
                        'mr-3 flex-shrink-0 h-5 w-5 transition-colors'
                      )}
                    />
                    {item.name}
                    <ChevronDown
                      className={cn(
                        'ml-auto h-4 w-4 transition-transform',
                        isSubmenuOpen ? 'rotate-180' : '',
                        isActive ? 'text-blue-600' : 'text-gray-400'
                      )}
                    />
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      isActive
                        ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 shadow-sm border-r-4 border-blue-600'
                        : 'text-gray-700 hover:bg-gray-50/80 hover:text-gray-900',
                      'group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ease-out'
                    )}
                  >
                    <Icon
                      className={cn(
                        isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600',
                        'mr-3 flex-shrink-0 h-5 w-5 transition-colors'
                      )}
                    />
                    {item.name}
                    {('showBadge' in item && item.showBadge && pendientesCount > 0) && (
                      <span className="ml-auto flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full">
                        {pendientesCount}
                      </span>
                    )}
                    {isActive && !('showBadge' in item && item.showBadge && pendientesCount > 0) && (
                      <ChevronRight className="ml-auto h-4 w-4 text-blue-600" />
                    )}
                  </Link>
                )}

                {/* Submenu */}
                {hasSubmenu && isSubmenuOpen && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.submenu?.map((subItem) => {
                      const SubIcon = subItem.icon
                      const isSubActive = pathname === subItem.href ||
                        (subItem.href !== '/dashboard' && pathname.startsWith(subItem.href))

                      return (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          onClick={onNavigate}
                          className={cn(
                            isSubActive
                              ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                            'group flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ease-out'
                          )}
                        >
                          <SubIcon
                            className={cn(
                              isSubActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600',
                              'mr-3 flex-shrink-0 h-4 w-4 transition-colors'
                            )}
                          />
                          {subItem.name}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </div>

      <UserSection />
    </div>
  )
}

function UserSection() {
  const { data: session } = useSession()

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  if (!session?.user) {
    return null
  }

  return (
    <div className="flex-shrink-0 border-t border-gray-200/60">
      <div className="p-4 bg-gray-50/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white font-semibold shadow-md">
            {session.user.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {session.user.name}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {session.user.email}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Cerrar Sesión
        </button>
      </div>
      <div className="px-4 py-3 bg-gray-50/30">
        <div className="text-xs text-gray-500 font-medium text-center">
          Sistema v1.0.0
        </div>
      </div>
    </div>
  )
}
