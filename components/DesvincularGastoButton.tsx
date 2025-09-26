'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Unlink } from "lucide-react"
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

interface DesvincularGastoButtonProps {
  vinculacionId: string
  gastoDescripcion: string
  montoAsignado: number
  onDesvinculado?: () => void
}

export default function DesvincularGastoButton({
  vinculacionId,
  gastoDescripcion,
  montoAsignado,
  onDesvinculado
}: DesvincularGastoButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDesvincular = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/desvincular-gasto?id=${vinculacionId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al desvincular el gasto')
      }

      setIsOpen(false)
      onDesvinculado?.()
    } catch (error) {
      console.error('Error:', error)
      alert(error instanceof Error ? error.message : 'Error al desvincular el gasto')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
        title="Desvincular gasto"
      >
        <Unlink className="h-4 w-4" />
      </Button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desvincular gasto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción desvinculará el gasto "{gastoDescripcion}"
              ({formatCurrency(montoAsignado)}) de este avance de obra.
              <br />
              <br />
              El monto quedará disponible para ser asignado a otros avances.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsOpen(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDesvincular}
              disabled={isDeleting}
            >
              {isDeleting ? 'Desvinculando...' : 'Desvincular'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}