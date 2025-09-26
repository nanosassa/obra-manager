'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  Home,
  DollarSign,
  TrendingUp,
  FileText,
  Settings,
  Users,
  Package,
  ChevronRight,
  Menu,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Gastos', href: '/dashboard/gastos', icon: DollarSign },
  { name: 'Avances de Obra', href: '/dashboard/avances', icon: TrendingUp },
  { name: 'Reportes', href: '/dashboard/reportes', icon: FileText },
  { name: 'Proveedores', href: '/dashboard/proveedores', icon: Package },
  { name: 'Personas', href: '/dashboard/personas', icon: Users },
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
            <SidebarContent pathname={pathname} />
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

function SidebarContent({ pathname }: { pathname: string }) {
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
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.name}
                href={item.href}
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
                {isActive && (
                  <ChevronRight className="ml-auto h-4 w-4 text-blue-600" />
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="flex-shrink-0 flex border-t border-gray-200/60 p-6 bg-gray-50/50">
        <div className="flex-shrink-0 w-full">
          <div className="text-xs text-gray-500 font-medium">
            Sistema v1.0.0
          </div>
        </div>
      </div>
    </div>
  )
}
