import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { cn } from './utils';
import { AlertTriangle, Info, ShieldAlert, CheckCircle2 } from 'lucide-react';

/**
 * AlertDialog — Confirmation modal replacing window.confirm() everywhere.
 */
export const AlertDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description,
  intent = 'danger',
  variant,
  confirmLabel,
  confirmText,
  cancelLabel = 'Cancel',
  cancelText,
  isLoading = false,
  className,
}) => {
  const resolvedIntent = variant || intent || 'danger';
  const intentConfig = intentStyles[resolvedIntent] || intentStyles.danger;
  const finalConfirmLabel = confirmText || confirmLabel || 'Confirm';
  const finalCancelLabel = cancelText || cancelLabel || 'Cancel';

  const handleConfirm = () => {
    if (isLoading) return;
    onConfirm?.();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className={cn('max-w-md', className)}
      closeOnOutsideClick={!isLoading}
    >
      <div className="flex flex-col items-center sm:flex-row sm:items-start gap-4">
        {/* Intent icon */}
        <div
          className={cn(
            'flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full',
            intentConfig.iconBg
          )}
        >
          <intentConfig.Icon className={cn('w-6 h-6', intentConfig.iconColor)} />
        </div>

        {/* Content */}
        <div className="flex-1 text-center sm:text-left">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{description}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-6 pt-4 border-t border-border/50">
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          disabled={isLoading}
        >
          {finalCancelLabel}
        </Button>
        <Button
          variant={intentConfig.buttonVariant}
          size="sm"
          onClick={handleConfirm}
          isLoading={isLoading}
          className={cn('gap-1.5', intentConfig.buttonClass)}
        >
          {finalConfirmLabel}
        </Button>
      </div>
    </Modal>
  );
};

const intentStyles = {
  danger: {
    Icon: AlertTriangle,
    iconBg: 'bg-destructive/10',
    iconColor: 'text-destructive',
    buttonVariant: 'danger',
    buttonClass: '',
  },
  warning: {
    Icon: ShieldAlert,
    iconBg: 'bg-warning/10',
    iconColor: 'text-warning',
    buttonVariant: 'primary',
    buttonClass: 'bg-warning hover:bg-warning/90 text-warning-foreground',
  },
  info: {
    Icon: Info,
    iconBg: 'bg-info/10',
    iconColor: 'text-info',
    buttonVariant: 'primary',
    buttonClass: '',
  },
  success: {
    Icon: CheckCircle2,
    iconBg: 'bg-success/10',
    iconColor: 'text-success',
    buttonVariant: 'primary',
    buttonClass: 'bg-success hover:bg-success/90 text-white',
  },
};
