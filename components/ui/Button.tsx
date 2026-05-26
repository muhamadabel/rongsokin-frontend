import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', ...props }, ref) => {
    let variantStyles = '';
    
    switch (variant) {
      case 'primary':
        variantStyles = 'bg-brand-500 hover:bg-brand-600 text-white border border-transparent';
        break;
      case 'outline':
        variantStyles = 'border border-brand-500 text-brand-700 hover:bg-brand-50 bg-transparent';
        break;
      case 'ghost':
        variantStyles = 'text-brand-600 hover:bg-brand-50 border border-transparent bg-transparent';
        break;
      case 'danger':
        variantStyles = 'bg-status-error hover:bg-red-600 text-white border border-transparent';
        break;
    }

    return (
      <button
        ref={ref}
        className={`rounded-md px-4 py-2.5 text-sm font-medium font-body transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 ${variantStyles} ${className}`}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
