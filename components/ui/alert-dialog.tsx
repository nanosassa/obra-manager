import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface AlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

interface AlertDialogContentProps {
  children: React.ReactNode
  className?: string
}

interface AlertDialogHeaderProps {
  children: React.ReactNode
  className?: string
}

interface AlertDialogTitleProps {
  children: React.ReactNode
  className?: string
}

interface AlertDialogDescriptionProps {
  children: React.ReactNode
  className?: string
}

interface AlertDialogFooterProps {
  children: React.ReactNode
  className?: string
}

interface AlertDialogActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: "default" | "destructive" | "outline"
}

interface AlertDialogCancelProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

const AlertDialog = ({ open, onOpenChange, children }: AlertDialogProps) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-50">
        {children}
      </div>
    </div>
  )
}

const AlertDialogContent = ({ children, className }: AlertDialogContentProps) => (
  <div className={cn(
    "bg-white rounded-lg shadow-lg border border-gray-200 p-6 w-full max-w-md mx-4",
    className
  )}>
    {children}
  </div>
)

const AlertDialogHeader = ({ children, className }: AlertDialogHeaderProps) => (
  <div className={cn("space-y-2 mb-4", className)}>
    {children}
  </div>
)

const AlertDialogTitle = ({ children, className }: AlertDialogTitleProps) => (
  <h2 className={cn("text-lg font-semibold text-gray-900", className)}>
    {children}
  </h2>
)

const AlertDialogDescription = ({ children, className }: AlertDialogDescriptionProps) => (
  <div className={cn("text-sm text-gray-600", className)}>
    {children}
  </div>
)

const AlertDialogFooter = ({ children, className }: AlertDialogFooterProps) => (
  <div className={cn("flex justify-end gap-3 mt-6", className)}>
    {children}
  </div>
)

const AlertDialogAction = ({ children, variant = "default", className, ...props }: AlertDialogActionProps) => (
  <Button variant={variant} className={className} {...props}>
    {children}
  </Button>
)

const AlertDialogCancel = ({ children, className, ...props }: AlertDialogCancelProps) => (
  <Button variant="outline" className={className} {...props}>
    {children}
  </Button>
)

export {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
}