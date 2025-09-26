'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
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

interface DeleteAvanceButtonProps {
  avanceId: string
  avanceDescripcion: string
  gastosCount?: number
}

export default function DeleteAvanceButton({ avanceId, avanceDescripcion, gastosCount = 0 }: DeleteAvanceButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/avances?id=${avanceId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al eliminar el avance')
      }

      // Refresh the page to show updated data
      router.refresh()
      setIsOpen(false)
    } catch (error) {
      console.error('Error:', error)
      alert(error instanceof Error ? error.message : 'Error al eliminar el avance')
    } finally {
      setIsDeleting(false)
    }
  }

  const canDelete = gastosCount === 0

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        disabled={!canDelete}
        title={!canDelete ? `No se puede eliminar: tiene ${gastosCount} gastos vinculados` : 'Eliminar avance'}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar avance de obra?</AlertDialogTitle>
            <AlertDialogDescription>
              {!canDelete ? (
                <>
                  No se puede eliminar el avance "{avanceDescripcion}" porque tiene {gastosCount} gastos vinculados.
                  Primero debe desvincular o eliminar los gastos asociados.
                </>
              ) : (
                <>
                  Esta acción eliminará permanentemente el avance de obra "{avanceDescripcion}".
                  Esta acción no se puede deshacer.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsOpen(false)}>
              {!canDelete ? 'Entendido' : 'Cancelar'}
            </AlertDialogCancel>
            {canDelete && (
              <AlertDialogAction
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}