'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Search, Link as LinkIcon } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"

interface Gasto {
  id: string
  descripcion: string
  monto: number
  fecha: string
  categorias_gasto: {
    nombre: string
  }
  monto_disponible: number
}

interface VincularGastoButtonProps {
  avanceId: string
  onVinculado?: () => void
}

export default function VincularGastoButton({ avanceId, onVinculado }: VincularGastoButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [filteredGastos, setFilteredGastos] = useState<Gasto[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  const [formData, setFormData] = useState({
    gasto_id: '',
    monto_asignado: '',
    notas: ''
  })

  useEffect(() => {
    if (isOpen) {
      fetchGastosDisponibles()
    }
  }, [isOpen])

  useEffect(() => {
    // Filtrar gastos basado en el término de búsqueda
    const filtered = gastos.filter(gasto =>
      gasto.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gasto.categorias_gasto.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredGastos(filtered)
  }, [gastos, searchTerm])

  const fetchGastosDisponibles = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/gastos-disponibles')
      if (!response.ok) throw new Error('Error al obtener gastos')

      const data = await response.json()
      setGastos(data.gastos)
      setFilteredGastos(data.gastos)
    } catch (error) {
      console.error('Error:', error)
      alert('Error al cargar los gastos disponibles')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGastoSelect = (gastoId: string) => {
    const gasto = gastos.find(g => g.id === gastoId)
    setFormData(prev => ({
      ...prev,
      gasto_id: gastoId,
      monto_asignado: gasto?.monto_disponible.toString() || ''
    }))
  }

  const handleSubmit = async () => {
    if (!formData.gasto_id || !formData.monto_asignado) {
      alert('Por favor seleccione un gasto y especifique el monto')
      return
    }

    const montoAsignado = parseFloat(formData.monto_asignado)
    const gasto = gastos.find(g => g.id === formData.gasto_id)

    if (!gasto || montoAsignado > gasto.monto_disponible) {
      alert('El monto asignado no puede ser mayor al monto disponible')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/vincular-gasto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gasto_id: formData.gasto_id,
          avance_obra_id: avanceId,
          monto_asignado: montoAsignado,
          notas: formData.notas || null
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al vincular el gasto')
      }

      setIsOpen(false)
      setFormData({ gasto_id: '', monto_asignado: '', notas: '' })
      onVinculado?.()
    } catch (error) {
      console.error('Error:', error)
      alert(error instanceof Error ? error.message : 'Error al vincular el gasto')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedGasto = gastos.find(g => g.id === formData.gasto_id)

  return (
    <>
      <Button size="sm" onClick={() => setIsOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Vincular Gasto
      </Button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Vincular Gasto al Avance</AlertDialogTitle>
            <AlertDialogDescription>
              Seleccione un gasto existente para vincularlo a este avance de obra
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            {/* Búsqueda */}
            <div>
              <Label htmlFor="search">Buscar Gasto</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  type="text"
                  placeholder="Buscar por descripción o categoría..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Lista de gastos */}
            {isLoading ? (
              <div className="text-center py-4">Cargando gastos...</div>
            ) : (
              <div>
                <Label>Gastos Disponibles</Label>
                <div className="max-h-60 overflow-y-auto border rounded-lg">
                  {filteredGastos.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      {searchTerm ? 'No se encontraron gastos' : 'No hay gastos disponibles'}
                    </div>
                  ) : (
                    filteredGastos.map((gasto) => (
                      <div
                        key={gasto.id}
                        className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                          formData.gasto_id === gasto.id ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                        onClick={() => handleGastoSelect(gasto.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{gasto.descripcion}</p>
                            <p className="text-sm text-gray-500">
                              {gasto.categorias_gasto.nombre} • {new Date(gasto.fecha).toLocaleDateString('es-AR')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(gasto.monto)}</p>
                            <p className="text-sm text-green-600">
                              Disponible: {formatCurrency(gasto.monto_disponible)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Formulario de vinculación */}
            {selectedGasto && (
              <div className="space-y-4 border-t pt-4">
                <div>
                  <Label htmlFor="monto_asignado">Monto a Asignar *</Label>
                  <Input
                    id="monto_asignado"
                    type="number"
                    min="0"
                    max={selectedGasto.monto_disponible}
                    step="0.01"
                    placeholder="0.00"
                    value={formData.monto_asignado}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      monto_asignado: e.target.value
                    }))}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Máximo disponible: {formatCurrency(selectedGasto.monto_disponible)}
                  </p>
                </div>

                <div>
                  <Label htmlFor="notas">Notas</Label>
                  <Textarea
                    id="notas"
                    placeholder="Notas sobre esta vinculación..."
                    value={formData.notas}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      notas: e.target.value
                    }))}
                    rows={2}
                  />
                </div>
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsOpen(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit}
              disabled={!selectedGasto || !formData.monto_asignado || isSubmitting}
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Vinculando...' : 'Vincular Gasto'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}