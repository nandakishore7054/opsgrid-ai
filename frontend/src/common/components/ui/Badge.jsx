import React from 'react';
import { cn } from './utils';

export const Badge = React.forwardRef(({ className, variant = 'default', outline = false, children, ...props }, ref) => {
  const baseStyles = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
  
  const variants = {
    default: "bg-secondary text-secondary-foreground",
    primary: "bg-primary text-primary-foreground",
    success: "bg-success/20 text-success dark:text-success-hover",
    warning: "bg-warning/20 text-warning dark:text-warning-hover",
    error: "bg-destructive/20 text-destructive dark:text-destructive-hover",
    destructive: "bg-destructive/20 text-destructive dark:text-destructive-hover",
    info: "bg-info/20 text-info dark:text-info-hover",
    outline: "border border-border text-foreground bg-transparent",
  };

  const outlines = {
    default: "border border-border text-foreground bg-transparent",
    primary: "border border-primary text-primary bg-transparent",
    success: "border border-success text-success bg-transparent",
    warning: "border border-warning text-warning bg-transparent",
    error: "border border-destructive text-destructive bg-transparent",
    destructive: "border border-destructive text-destructive bg-transparent",
    info: "border border-info text-info bg-transparent",
    outline: "border border-border text-foreground bg-transparent",
  };

  const selectedStyles = outline ? outlines[variant] || outlines.default : variants[variant] || variants.default;

  return (
    <div ref={ref} className={cn(baseStyles, selectedStyles, className)} {...props}>
      {children}
    </div>
  );
});

Badge.displayName = "Badge";
