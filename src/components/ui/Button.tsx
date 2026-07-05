import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-all duration-150 ease-out active:translate-y-[1px]',
          'disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-base',
          {
            'bg-accent text-white hover:bg-accent/90 shadow-sm': variant === 'primary',
            'bg-bg-elevated text-text-primary hover:bg-bg-elevated-2 border border-divider': variant === 'secondary',
            'bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-elevated': variant === 'ghost',
            'h-8 px-3 text-xs': size === 'sm',
            'h-10 px-4 text-sm': size === 'md',
            'h-12 px-6 text-base': size === 'lg',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
