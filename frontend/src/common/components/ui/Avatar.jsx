import React from 'react';
import { cn } from './utils';

/**
 * Avatar - Reusable component for displaying user profile images or fallback initials.
 * 
 * @param {Object} props
 * @param {string} [props.src] - URL of the avatar image.
 * @param {string} [props.fallback] - Fallback initials to display if no image is provided.
 * @param {string} [props.alt] - Accessibility alt text for the image.
 * @param {'sm' | 'md' | 'lg' | 'xl' | '2xl'} [props.size='md'] - Predefined sizing classes.
 * @param {'online' | 'offline' | 'busy' | 'away'} [props.status] - Optional status indicator.
 * @param {string} [props.className] - Additional class names for styling overrides.
 */
export const Avatar = ({ 
  src, 
  fallback = '?', 
  alt = 'User Avatar', 
  size = 'md', 
  status, 
  className 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm',
    xl: 'w-12 h-12 text-base',
    '2xl': 'w-24 h-24 text-3xl'
  };

  const statusColor = {
    online: 'bg-success shadow-[0_0_0_2px_var(--bg-background)]',
    offline: 'bg-muted-foreground shadow-[0_0_0_2px_var(--bg-background)]',
    busy: 'bg-destructive shadow-[0_0_0_2px_var(--bg-background)]',
    away: 'bg-warning shadow-[0_0_0_2px_var(--bg-background)]'
  };

  return (
    <div className={cn('relative inline-flex flex-shrink-0', className)}>
      {src ? (
        <img 
          src={src} 
          alt={alt} 
          className={cn(
            'rounded-full object-cover border border-border/50 shadow-sm transition-all',
            sizeClasses[size]
          )}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextElementSibling.style.display = 'flex';
          }}
        />
      ) : null}
      
      {/* Fallback (rendered if no src, or if src fails to load) */}
      <div 
        className={cn(
          'rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold border border-primary/20 shadow-sm transition-all',
          sizeClasses[size]
        )}
        style={{ display: src ? 'none' : 'flex' }}
      >
        {fallback.substring(0, 2).toUpperCase()}
      </div>

      {status && (
        <span 
          className={cn(
            'absolute bottom-0 right-0 rounded-full',
            size === 'sm' ? 'w-1.5 h-1.5' : size === 'xl' ? 'w-3 h-3' : 'w-2.5 h-2.5',
            statusColor[status]
          )} 
        />
      )}
    </div>
  );
};
