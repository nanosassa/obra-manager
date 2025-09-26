import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateLong(date: Date | string): string {
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date))
}

export function getEstadoBadgeVariant(estado: string): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" {
  switch (estado.toUpperCase()) {
    case 'PAGADO':
      return 'success'
    case 'PENDIENTE':
      return 'warning'
    case 'CANCELADO':
      return 'destructive'
    default:
      return 'default'
  }
}

export function getCategoriaBadgeVariant(categoria: string): "default" | "secondary" | "destructive" | "outline" {
  switch (categoria.toLowerCase()) {
    case 'materiales':
      return 'default'
    case 'mano de obra':
      return 'secondary'
    case 'herramientas':
      return 'outline'
    default:
      return 'default'
  }
}
