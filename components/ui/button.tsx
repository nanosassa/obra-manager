import { forwardRef, ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const buttonVariants = {
  default: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md transition-all",
  destructive: "bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow-md transition-all",
  outline: "border border-gray-200 bg-white hover:bg-gray-50 hover:text-gray-900 shadow-sm hover:shadow-md transition-all",
  secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 shadow-sm transition-all",
  ghost: "hover:bg-gray-100 hover:text-gray-900 transition-colors",
  link: "text-blue-600 underline-offset-4 hover:underline transition-colors",
}

const sizeVariants = {
  default: "h-10 px-4 py-2 rounded-lg",
  sm: "h-9 rounded-lg px-3 text-sm",
  lg: "h-11 rounded-lg px-8",
  icon: "h-10 w-10 rounded-lg",
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          buttonVariants[variant],
          sizeVariants[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"
