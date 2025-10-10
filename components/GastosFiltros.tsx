'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Filter, Search, X } from 'lucide-react'

interface GastosFiltrosProps {
  categorias: any[]
  personas: any[]
  estados: any[]
  proveedores: any[]
}

export default function GastosFiltros({
  categorias,
  personas,
  estados,
  proveedores
}: GastosFiltrosProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [filtros, setFiltros] = useState({
    categoria: searchParams.get('categoria') || '',
    persona: searchParams.get('persona') || '',
    estado: searchParams.get('estado') || '',
    proveedor: searchParams.get('proveedor') || '',
    desde: searchParams.get('desde') || '',
    hasta: searchParams.get('hasta') || '',
    busqueda: searchParams.get('busqueda') || '',
    montoMin: searchParams.get('montoMin') || '',
    montoMax: searchParams.get('montoMax') || '',
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
      router.push(`/dashboard/gastos?${params.toString()}`)
    })
  }

  const limpiarFiltros = () => {
    setFiltros({
      categoria: '',
      persona: '',
      estado: '',
      proveedor: '',
      desde: '',
      hasta: '',
      busqueda: '',
      montoMin: '',
      montoMax: '',
    })

    startTransition(() => {
      router.push('/dashboard/gastos')
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Búsqueda por texto */}
          <div className="lg:col-span-2">
            <Label htmlFor="busqueda">Buscar</Label>
            <Input
              id="busqueda"
              placeholder="Buscar en descripción..."
              value={filtros.busqueda}
              onChange={(e) => handleChange('busqueda', e.target.value)}
            />
          </div>

          {/* Categoría */}
          <div>
            <Label htmlFor="categoria">Categoría</Label>
            <Select
              id="categoria"
              value={filtros.categoria}
              onChange={(e) => handleChange('categoria', e.target.value)}
            >
              <option value="">Todas</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </Select>
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
                <option key={prov.id} value={prov.id}>
                  {prov.nombre}
                </option>
              ))}
            </Select>
          </div>

          {/* Pagado por */}
          <div>
            <Label htmlFor="persona">Pagado por</Label>
            <Select
              id="persona"
              value={filtros.persona}
              onChange={(e) => handleChange('persona', e.target.value)}
            >
              <option value="">Todos</option>
              {personas.map(per => (
                <option key={per.id} value={per.id}>
                  {per.nombre}
                </option>
              ))}
            </Select>
          </div>

          {/* Estado */}
          <div>
            <Label htmlFor="estado">Estado</Label>
            <Select
              id="estado"
              value={filtros.estado}
              onChange={(e) => handleChange('estado', e.target.value)}
            >
              <option value="">Todos</option>
              {estados.map(est => (
                <option key={est.id} value={est.id}>
                  {est.nombre}
                </option>
              ))}
            </Select>
          </div>

          {/* Fecha desde */}
          <div>
            <Label htmlFor="desde">Desde</Label>
            <Input
              id="desde"
              type="date"
              value={filtros.desde}
              onChange={(e) => handleChange('desde', e.target.value)}
            />
          </div>

          {/* Fecha hasta */}
          <div>
            <Label htmlFor="hasta">Hasta</Label>
            <Input
              id="hasta"
              type="date"
              value={filtros.hasta}
              onChange={(e) => handleChange('hasta', e.target.value)}
            />
          </div>

          {/* Monto mínimo */}
          <div>
            <Label htmlFor="montoMin">Monto mínimo</Label>
            <Input
              id="montoMin"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={filtros.montoMin}
              onChange={(e) => handleChange('montoMin', e.target.value)}
            />
          </div>

          {/* Monto máximo */}
          <div>
            <Label htmlFor="montoMax">Monto máximo</Label>
            <Input
              id="montoMax"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={filtros.montoMax}
              onChange={(e) => handleChange('montoMax', e.target.value)}
            />
          </div>

          {/* Botón aplicar */}
          <div className="flex items-end lg:col-span-2">
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
