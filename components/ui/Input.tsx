import * as React from "react"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <input
        className={`w-full rounded-md border border-ink bg-surface-raised px-4 py-3 text-sm font-body text-ink placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-ink disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
