import React from 'react';
import { cn } from './utils';
import { ChevronDown } from 'lucide-react';

export const Select = React.forwardRef(({
  className,
  error,
  helperText,
  icon: Icon,
  disabled,
  options = [],
  placeholder,
  value,
  onChange,
  ...props
}, ref) => {
  return (
    <div className="relative w-full">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground z-10">
          <Icon className="w-4 h-4" />
        </div>
      )}
      
      <div className="relative">
        <select
          ref={ref}
          disabled={disabled}
          value={value}
          onChange={onChange}
          className={cn(
            "flex h-10 w-full appearance-none rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors shadow-sm cursor-pointer",
            Icon && "pl-10",
            error && "border-destructive focus-visible:ring-destructive",
            !value && placeholder && "text-muted-foreground",
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          )}
          {options.map((opt, idx) => {
            const isObj = typeof opt === 'object';
            const optValue = isObj ? opt.value : opt;
            const optLabel = isObj ? opt.label : opt;
            const optDisabled = isObj ? opt.disabled : false;
            
            return (
              <option key={idx} value={optValue} disabled={optDisabled}>
                {optLabel}
              </option>
            );
          })}
          {/* Support for passing children directly like native <select> */}
          {props.children}
        </select>
        
        {!props.multiple && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
            <ChevronDown className="w-4 h-4 opacity-70" />
          </div>
        )}
      </div>

      {(error || helperText) && (
        <p className={cn("mt-1 text-xs", error ? "text-destructive" : "text-muted-foreground")}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';
