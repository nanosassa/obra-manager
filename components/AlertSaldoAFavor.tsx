'use client'

import { useState, useEffect } from 'react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface SaldoAFavor {
  pago_id: string
  fecha: Date
  monto_total: number
  saldo_disponible: number
  proveedor: string
  persona: string | null
  comprobante: string | null
}

interface Props {
  proveedorId: string | null
  personaId: string | null
  proyectoId: string
  onAplicarChange: (aplicar: boolean, saldos: SaldoAFavor[]) => void
}

export default function AlertSaldoAFavor({
  proveedorId,
  personaId,
  proyectoId,
  onAplicarChange
}: Props) {
  const [saldos, setSaldos] = useState<SaldoAFavor[]>([])
  const [aplicar, setAplicar] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Reset when dependencies change
    setAplicar(false)
    onAplicarChange(false, [])

    if (!proveedorId || !proyectoId) {
      setSaldos([])
      return
    }

    setLoading(true)
    const params = new URLSearchParams({
      proyecto_id: proyectoId
    })

    if (proveedorId) params.append('proveedor_id', proveedorId)
    if (personaId) params.append('persona_id', personaId)

    fetch(`/api/pagos/saldos-a-favor?${params}`)
      .then(res => res.json())
      .then(data => {
        setSaldos(data)
        setLoading(false)
      })
      .catch(() => {
        setSaldos([])
        setLoading(false)
      })
  }, [proveedorId, personaId, proyectoId])

  if (loading || saldos.length === 0) return null

  const totalSaldoDisponible = saldos.reduce((sum, s) => sum + s.saldo_disponible, 0)
  const saldoPrincipal = saldos[0] // Mostrar el más reciente

  return (
    <Alert className="bg-green-50 border-green-200">
      <AlertCircle className="h-4 w-4 text-green-600" />
      <AlertTitle className="text-green-800">Saldo a favor disponible</AlertTitle>
      <AlertDescription>
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm text-green-700">
              Tienes <strong className="text-green-900">{formatCurrency(totalSaldoDisponible)}</strong> a favor de{' '}
              <strong className="text-green-900">{saldoPrincipal.proveedor}</strong>
              {saldos.length > 1 && (
                <span className="text-xs text-green-600 ml-2">
                  ({saldos.length} pago{saldos.length !== 1 ? 's' : ''})
                </span>
              )}
            </p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
            <Checkbox
              checked={aplicar}
              onCheckedChange={(checked: boolean) => {
                setAplicar(checked)
                onAplicarChange(checked, checked ? saldos : [])
              }}
            />
            <span className="text-sm font-medium text-green-800">Aplicar a este gasto</span>
          </label>
        </div>
      </AlertDescription>
    </Alert>
  )
}
