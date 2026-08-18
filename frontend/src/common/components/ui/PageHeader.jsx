import React from 'react';
import { cn } from './utils';
import { ChevronRight } from 'lucide-react';
import { Card } from './Card';
import { motion } from 'framer-motion';

/**
 * PageHeader — Standardized page header for all OpsGrid pages.
 *
 * Variants:
 *   - "default"   → Simple heading without card wrapper (backward-compatible).
 *   - "prominent" → Card with gradient background, decorative blur, icon badge.
 *
 * @param {object}  props
 * @param {string}  props.title          - Page heading text (required).
 * @param {string}  [props.description]  - Subtitle / supporting text.
 * @param {React.ElementType} [props.icon] - Lucide icon component to display in a badge.
 * @param {React.ReactNode}   [props.badge] - Optional inline badge next to the title.
 * @param {Array}   [props.breadcrumbs]  - Array of { label, href? } for breadcrumb trail.
 * @param {React.ReactNode}   [props.actions] - Right-aligned action buttons / controls.
 * @param {"default"|"prominent"} [props.variant] - Visual style. Defaults to "default".
 * @param {string}  [props.className]    - Additional className overrides.
 */
export const PageHeader = ({
  title,
  description,
  icon: Icon,
  badge,
  breadcrumbs,
  actions,
  variant = 'default',
  className,
}) => {
  const breadcrumbNav = breadcrumbs && breadcrumbs.length > 0 && (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-4">
      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={index}>
          {index > 0 && <ChevronRight className="h-4 w-4" />}
          {crumb.href ? (
            <a href={crumb.href} className="hover:text-foreground transition-colors">
              {crumb.label}
            </a>
          ) : (
            <span className="font-medium text-foreground">{crumb.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );

  // ── Default variant: simple heading (backward-compatible) ──
  if (variant === 'default') {
    return (
      <div className={cn("flex flex-col gap-4 pb-6", className)}>
        {breadcrumbNav}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2.5 bg-primary/10 rounded-xl text-primary flex-shrink-0">
                <Icon className="w-6 h-6" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
                {badge}
              </div>
              {description && (
                <p className={cn("mt-1 text-base text-muted-foreground", Icon && "ml-0")}>{description}</p>
              )}
            </div>
          </div>
          {actions && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Prominent variant: gradient card with decorative background ──
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={className}
    >
      {breadcrumbNav}
      <Card className="p-6 bg-gradient-to-r from-surface to-surface-muted/30 border-none shadow-sm relative overflow-hidden">
        {/* Decorative background blur */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {Icon && (
                <div className="p-2.5 bg-primary/10 rounded-xl text-primary flex-shrink-0">
                  <Icon className="w-6 h-6" />
                </div>
              )}
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
                {badge}
              </div>
            </div>
            {description && (
              <p className={cn("text-muted-foreground", Icon && "ml-[52px]")}>{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};
