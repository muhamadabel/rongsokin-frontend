import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', ...props }, ref) => {
    let variantStyles = '';

    switch (variant) {
      case 'primary':
        // Wise signature: ink-on-lime pill
        variantStyles = 'bg-brand-500 hover:bg-brand-600 text-ink border border-transparent';
        break;
      case 'outline':
        // White tertiary with 1px ink hairline
        variantStyles = 'bg-surface-raised text-ink border border-ink hover:bg-surface-sunken';
        break;
      case 'ghost':
        variantStyles = 'text-ink hover:bg-surface-sunken border border-transparent bg-transparent';
        break;
      case 'danger':
        variantStyles = 'bg-status-error hover:brightness-95 text-white border border-transparent';
        break;
    }

    return (
      <button
        ref={ref}
        className={`rounded-2xl px-6 py-3 text-sm font-semibold font-body transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 ${variantStyles} ${className}`}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
