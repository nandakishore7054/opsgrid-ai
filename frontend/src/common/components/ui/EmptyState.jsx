import React from 'react';
import { motion } from 'framer-motion';
import { cn } from './utils';

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn("flex flex-col items-center justify-center p-8 text-center min-h-[300px]", className)}
    >
      {Icon && (
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-surface-muted mb-4 shadow-sm border border-border"
        >
          <Icon className="h-8 w-8 text-muted-foreground" />
        </motion.div>
      )}
      <h3 className="mt-4 text-lg font-semibold text-foreground tracking-tight">{title}</h3>
      {description && (
        <p className="mt-2 mb-6 text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-2 flex items-center justify-center gap-3">
          {action}
          {secondaryAction}
        </div>
      )}
    </motion.div>
  );
};
