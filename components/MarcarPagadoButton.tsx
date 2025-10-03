'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'
import { Loader2 } from '@/components/ui/spinner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { formatCurrency } from '@/lib/utils'

interface Props {
  gastoId: string
  gastoDescripcion: string
  monto: number
  estadoPagadoId?: string
}

export default function MarcarPagadoButton({
  gastoId,
  gastoDescripcion,
  monto,
  estadoPagadoId
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)

  const handleMarcarPagado = async () => {
    if (!estadoPagadoId) {
      alert('Error: No se pudo obtener el estado de pago')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/gastos/${gastoId}/marcar-pagado`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          estado_id: estadoPagadoId
        })
      })

      if (response.ok) {
        router.refresh()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error || 'No se pudo marcar como pagado'}`)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al marcar como pagado')
    } finally {
      setLoading(false)
      setShowDialog(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDialog(true)}
        disabled={loading || !estadoPagadoId}
        className="text-green-600 hover:text-green-700"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle className="h-4 w-4" />
        )}
        <span className="hidden sm:inline ml-1">Pagar</span>
      </Button>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Marcar como pagado?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Está a punto de marcar este gasto como pagado:</p>
              <div className="p-3 bg-gray-50 rounded-lg space-y-1">
                <p className="font-medium text-gray-900">{gastoDescripcion}</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(monto)}</p>
              </div>
              <p className="text-sm">
                Esta acción se puede revertir editando el gasto posteriormente.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMarcarPagado}
              className="bg-green-600 hover:bg-green-700"
            >
              Confirmar Pago
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}