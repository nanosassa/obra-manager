'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Filter, Search, X } from 'lucide-react'

interface AvancesFiltrosProps {
  proveedores: string[] // Lista única de proveedores
}

export default function AvancesFiltros({ proveedores }: AvancesFiltrosProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [filtros, setFiltros] = useState({
    busqueda: searchParams.get('busqueda') || '',
    proveedor: searchParams.get('proveedor') || '',
    presupuestoMin: searchParams.get('presupuestoMin') || '',
    presupuestoMax: searchParams.get('presupuestoMax') || '',
    avanceMin: searchParams.get('avanceMin') || '',
    avanceMax: searchParams.get('avanceMax') || '',
  })

  const handleChange = (field: string, value: string) => {
    setFiltros(prev => ({ ...prev, [field]: value }))
  }

  const aplicarFiltros = () => {
    const params = new URLSearchParams()

    Object.entries(filtros).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      }
    })

    startTransition(() => {
      router.push(`/dashboard/avances?${params.toString()}`)
    })
  }

  const limpiarFiltros = () => {
    setFiltros({
      busqueda: '',
      proveedor: '',
      presupuestoMin: '',
      presupuestoMax: '',
      avanceMin: '',
      avanceMax: '',
    })

    startTransition(() => {
      router.push('/dashboard/avances')
    })
  }

  const hayFiltrosActivos = Object.values(filtros).some(v => v !== '')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </span>
          {hayFiltrosActivos && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={limpiarFiltros}
              disabled={isPending}
            >
              <X className="h-4 w-4 mr-1" />
              Limpiar
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Búsqueda por texto */}
          <div className="lg:col-span-3">
            <Label htmlFor="busqueda">Buscar</Label>
            <Input
              id="busqueda"
              placeholder="Buscar en descripción o notas..."
              value={filtros.busqueda}
              onChange={(e) => handleChange('busqueda', e.target.value)}
            />
          </div>

          {/* Proveedor */}
          <div>
            <Label htmlFor="proveedor">Proveedor</Label>
            <Select
              id="proveedor"
              value={filtros.proveedor}
              onChange={(e) => handleChange('proveedor', e.target.value)}
            >
              <option value="">Todos</option>
              {proveedores.map(prov => (
                <option key={prov} value={prov}>
                  {prov}
                </option>
              ))}
            </Select>
          </div>

          {/* Presupuesto mínimo */}
          <div>
            <Label htmlFor="presupuestoMin">Presupuesto mínimo</Label>
            <Input
              id="presupuestoMin"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={filtros.presupuestoMin}
              onChange={(e) => handleChange('presupuestoMin', e.target.value)}
            />
          </div>

          {/* Presupuesto máximo */}
          <div>
            <Label htmlFor="presupuestoMax">Presupuesto máximo</Label>
            <Input
              id="presupuestoMax"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={filtros.presupuestoMax}
              onChange={(e) => handleChange('presupuestoMax', e.target.value)}
            />
          </div>

          {/* Avance mínimo */}
          <div>
            <Label htmlFor="avanceMin">Progreso mínimo %</Label>
            <Input
              id="avanceMin"
              type="number"
              min="0"
              max="100"
              placeholder="0"
              value={filtros.avanceMin}
              onChange={(e) => handleChange('avanceMin', e.target.value)}
            />
          </div>

          {/* Avance máximo */}
          <div>
            <Label htmlFor="avanceMax">Progreso máximo %</Label>
            <Input
              id="avanceMax"
              type="number"
              min="0"
              max="100"
              placeholder="100"
              value={filtros.avanceMax}
              onChange={(e) => handleChange('avanceMax', e.target.value)}
            />
          </div>

          {/* Botón aplicar */}
          <div className="flex items-end">
            <Button
              type="button"
              onClick={aplicarFiltros}
              disabled={isPending}
              className="w-full"
            >
              <Search className="h-4 w-4 mr-2" />
              {isPending ? 'Filtrando...' : 'Aplicar Filtros'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
