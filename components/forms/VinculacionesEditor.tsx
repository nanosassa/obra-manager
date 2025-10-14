'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export interface Vinculacion {
  id: string | null  // null para nuevas vinculaciones
  avance_obra_id: string
  monto_asignado: number
  notas: string
  _toDelete?: boolean
}

interface VinculacionesEditorProps {
  montoGasto: number
  vinculaciones: Vinculacion[]
  onChange: (vinculaciones: Vinculacion[]) => void
  avances: Array<{
    id: string
    descripcion: string
    monto_presupuestado: number | null
  }>
}

export default function VinculacionesEditor({
  montoGasto,
  vinculaciones,
  onChange,
  avances
}: VinculacionesEditorProps) {
  const vinculacionesActivas = vinculaciones.filter(v => !v._toDelete)

  // Asegurar que todos los montos sean números válidos
  const totalVinculado = vinculacionesActivas.reduce((sum, v) => {
    const monto = Number(v.monto_asignado)
    return sum + (isNaN(monto) ? 0 : monto)
  }, 0)

  const diferencia = montoGasto - totalVinculado
  const esValido = vinculacionesActivas.length === 0 || Math.abs(diferencia) < 0.01

  const agregarVinculacion = () => {
    onChange([
      ...vinculaciones,
      {
        id: null,
        avance_obra_id: '',
        monto_asignado: Math.max(0, diferencia),
        notas: '',
      }
    ])
  }

  const actualizarVinculacion = (index: number, field: keyof Vinculacion, value: any) => {
    const nuevasVinculaciones = [...vinculaciones]
    nuevasVinculaciones[index] = {
      ...nuevasVinculaciones[index],
      [field]: value
    }
    onChange(nuevasVinculaciones)
  }

  const marcarParaEliminar = (index: number) => {
    const nuevasVinculaciones = [...vinculaciones]
    nuevasVinculaciones[index] = {
      ...nuevasVinculaciones[index],
      _toDelete: true
    }
    onChange(nuevasVinculaciones)
  }

  const restaurarVinculacion = (index: number) => {
    const nuevasVinculaciones = [...vinculaciones]
    delete nuevasVinculaciones[index]._toDelete
    onChange(nuevasVinculaciones)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vinculaciones con Avances de Obra</CardTitle>
        <CardDescription>
          Asigna este gasto a uno o más avances de obra. El monto total debe coincidir con el monto del gasto.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Indicador de montos */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex gap-6">
            <div>
              <span className="text-sm text-gray-600">Monto del gasto:</span>
              <p className="font-semibold">{formatCurrency(montoGasto)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Total vinculado:</span>
              <p className="font-semibold">{formatCurrency(totalVinculado)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Diferencia:</span>
              <p className={`font-semibold ${diferencia > 0.01 ? 'text-yellow-600' : diferencia < -0.01 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(diferencia)}
              </p>
            </div>
          </div>
          <div>
            {esValido ? (
              <Badge variant="success" className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Válido
              </Badge>
            ) : (
              <Badge variant="warning" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Ajustar montos
              </Badge>
            )}
          </div>
        </div>

        {/* Lista de vinculaciones */}
        {vinculaciones.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay vinculaciones. Este gasto quedará sin asignar a avances.
          </div>
        ) : (
          <div className="space-y-3">
            {vinculaciones.map((vinc, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 ${vinc._toDelete ? 'bg-red-50 border-red-200 opacity-60' : 'bg-white'}`}
              >
                {vinc._toDelete ? (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4 text-red-600" />
                      <span className="text-sm line-through">
                        {avances.find(a => a.id === vinc.avance_obra_id)?.descripcion || 'Avance eliminado'}
                      </span>
                      <span className="text-sm text-gray-500">
                        - {formatCurrency(vinc.monto_asignado)}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => restaurarVinculacion(index)}
                    >
                      Restaurar
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="text-sm font-medium">
                        {vinc.id ? 'Vinculación existente' : 'Nueva vinculación'} #{index + 1}
                      </h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => marcarParaEliminar(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>Avance de Obra *</Label>
                        <Select
                          value={vinc.avance_obra_id}
                          onChange={(e) => actualizarVinculacion(index, 'avance_obra_id', e.target.value)}
                          required
                        >
                          <option value="">Seleccione un avance...</option>
                          {avances.map(avance => (
                            <option key={avance.id} value={avance.id}>
                              {avance.descripcion}
                              {avance.monto_presupuestado && ` - Presup: ${formatCurrency(avance.monto_presupuestado)}`}
                            </option>
                          ))}
                        </Select>
                      </div>

                      <div>
                        <Label>Monto Asignado *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max={montoGasto}
                          placeholder="0.00"
                          value={vinc.monto_asignado || ''}
                          onChange={(e) => actualizarVinculacion(index, 'monto_asignado', parseFloat(e.target.value) || 0)}
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label>Notas</Label>
                        <Textarea
                          placeholder="Notas sobre esta vinculación..."
                          value={vinc.notas}
                          onChange={(e) => actualizarVinculacion(index, 'notas', e.target.value)}
                          rows={2}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Botón agregar */}
        <Button
          type="button"
          variant="outline"
          onClick={agregarVinculacion}
          className="w-full"
          disabled={montoGasto <= 0}
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar Vinculación
        </Button>

        {/* Mensaje de ayuda */}
        {!esValido && vinculacionesActivas.length > 0 && (
          <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Los montos no coinciden</p>
              <p className="mt-1">
                El monto total del gasto ({formatCurrency(montoGasto)}) debe ser igual a la suma de los montos vinculados ({formatCurrency(totalVinculado)}).
                {diferencia > 0 ? ` Faltan ${formatCurrency(diferencia)} por asignar.` : ` Hay ${formatCurrency(Math.abs(diferencia))} de más asignados.`}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
