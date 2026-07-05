import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'error' | 'neutral';
}

export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'neutral', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border',
          {
            'bg-status-success/10 text-status-success border-status-success/20': variant === 'success',
            'bg-status-error/10 text-status-error border-status-error/20': variant === 'error',
            'bg-bg-elevated text-text-secondary border-divider': variant === 'neutral',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';
