import React from 'react';
import { Card } from './Card';
import { Skeleton } from './Skeleton';
import { cn } from './utils';

const colorSchemes = {
  primary: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    iconBg: 'bg-primary/20',
    border: 'border-primary/20',
    hover: 'hover:border-primary/40',
    glow: 'from-primary/5'
  },
  success: {
    bg: 'bg-success/10',
    text: 'text-success dark:text-success-hover',
    iconBg: 'bg-success/20',
    border: 'border-success/20',
    hover: 'hover:border-success/40',
    glow: 'from-success/5'
  },
  warning: {
    bg: 'bg-warning/10',
    text: 'text-warning dark:text-warning-hover',
    iconBg: 'bg-warning/20',
    border: 'border-warning/20',
    hover: 'hover:border-warning/40',
    glow: 'from-warning/5'
  },
  danger: {
    bg: 'bg-destructive/10',
    text: 'text-destructive',
    iconBg: 'bg-destructive/20',
    border: 'border-destructive/20',
    hover: 'hover:border-destructive/40',
    glow: 'from-destructive/5'
  },
  info: {
    bg: 'bg-info/10',
    text: 'text-info dark:text-info-hover',
    iconBg: 'bg-info/20',
    border: 'border-info/20',
    hover: 'hover:border-info/40',
    glow: 'from-info/5'
  },
  default: {
    bg: 'bg-muted/10',
    text: 'text-foreground',
    iconBg: 'bg-muted/30',
    border: 'border-border/50',
    hover: 'hover:border-border',
    glow: 'from-transparent'
  }
};

/**
 * StatCard - Reusable component for displaying key performance indicators
 */
export const StatCard = ({
  title,
  value,
  icon: Icon,
  subtitle,
  variant = 'default',
  colorScheme = 'default',
  loading = false,
  badge,
  action,
  className,
  animated = false,
  progress = null,
  ...props
}) => {
  const scheme = colorSchemes[colorScheme] || colorSchemes.default;

  const baseClasses = "p-5 relative overflow-hidden group transition-all duration-300 min-w-0 w-full h-auto flex flex-col justify-between";
  
  const variantClasses = {
    default: "border border-border/70 bg-surface shadow-sm",
    elevated: "border border-border/70 bg-surface shadow-md",
    interactive: `cursor-pointer border ${scheme.border} ${scheme.hover} bg-surface shadow-sm hover:shadow-md hover:-translate-y-0.5`
  };

  if (loading) {
    return (
      <Card className={cn(baseClasses, variantClasses.default, className)} {...props}>
        <div className="flex items-center justify-between mb-3 gap-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
        </div>
        <Skeleton className="h-7 w-1/3 mb-2" />
        <Skeleton className="h-3 w-2/3" />
      </Card>
    );
  }

  return (
    <Card className={cn(baseClasses, variantClasses[variant], className)} {...props}>
      {/* Background Glow Effect */}
      <div className={cn(
        "absolute inset-0 opacity-0 transition-opacity duration-500 bg-gradient-to-tr via-transparent to-transparent pointer-events-none",
        scheme.glow,
        variant === 'interactive' ? "group-hover:opacity-100" : "opacity-10"
      )} />

      <div className="relative z-10 w-full min-w-0 flex flex-col justify-between flex-1">
        {/* Top Header: Title, Badge, Icon */}
        <div className="flex items-start justify-between gap-3 mb-2 min-w-0">
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider break-words">
              {title}
            </p>
            {badge && <div className="mt-1">{badge}</div>}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {action && <div>{action}</div>}
            {Icon && (
              <div className={cn(
                "p-2.5 rounded-xl transition-transform duration-300 shrink-0",
                scheme.bg,
                scheme.text,
                variant === 'interactive' && "group-hover:scale-105"
              )}>
                <Icon className="w-4 h-4" />
              </div>
            )}
          </div>
        </div>
        
        {/* Main Value & Subtitle */}
        <div className="min-w-0 mt-auto pt-1">
          <div className="text-2xl font-black text-foreground tracking-tight break-words">
            {value}
          </div>
          
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1 break-words leading-relaxed">
              {subtitle}
            </p>
          )}
          
          {/* Progress Bar if present */}
          {progress !== null && (
            <div className="mt-3 w-full bg-border/60 rounded-full h-1.5 overflow-hidden">
               <div 
                 className={cn("h-full rounded-full transition-all duration-1000", scheme.text.split(' ')[0].replace('text-', 'bg-'))} 
                 style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} 
               />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
