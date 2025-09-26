import { forwardRef, LabelHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "text-sm font-semibold text-gray-700 mb-2 block",
          className
        )}
        {...props}
      />
    )
  }
)
Label.displayName = "Label"
