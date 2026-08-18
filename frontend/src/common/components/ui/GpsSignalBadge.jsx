import React from 'react';
import { cn } from './utils';
import { Signal, SignalHigh, SignalMedium, SignalLow, SignalZero, WifiOff } from 'lucide-react';

/**
 * GpsSignalBadge — Human-readable GPS signal quality indicator.
 *
 * Converts raw accuracy (meters) into a business-friendly label:
 *   - ≤ 10m   → Excellent (green)
 *   - ≤ 30m   → Good     (green)
 *   - ≤ 100m  → Fair     (yellow)
 *   - ≤ 300m  → Weak     (orange/warning)
 *   - > 300m  → Poor     (red)
 *   - null    → Lost     (gray)
 *
 * @param {object}  props
 * @param {number|null} props.accuracy      - GPS accuracy in meters.
 * @param {boolean} [props.showLabel]       - Display text label. Default true.
 * @param {boolean} [props.showAccuracy]    - Also display the raw accuracy value. Default false.
 * @param {"sm"|"md"|"lg"} [props.size]     - Size variant. Default "sm".
 * @param {"badge"|"inline"|"dot"} [props.variant] - Display style. Default "badge".
 * @param {string}  [props.className]       - Additional CSS classes.
 */
export const GpsSignalBadge = ({
  accuracy,
  showLabel = true,
  showAccuracy = false,
  size = 'sm',
  variant = 'badge',
  className,
}) => {
  const signal = getSignalInfo(accuracy);

  // ── Dot variant: just a colored dot ──
  if (variant === 'dot') {
    return (
      <span
        className={cn('inline-block rounded-full', dotSize[size], signal.dotClass, className)}
        title={`GPS: ${signal.label}${accuracy != null ? ` (±${Math.round(accuracy)}m)` : ''}`}
      />
    );
  }

  // ── Inline variant: icon + text without background ──
  if (variant === 'inline') {
    return (
      <span
        className={cn('inline-flex items-center gap-1', signal.colorClass, className)}
        title={accuracy != null ? `GPS accuracy: ±${Math.round(accuracy)}m` : 'GPS signal lost'}
      >
        <signal.Icon className={iconSize[size]} />
        {showLabel && <span className={cn(textSize[size], 'font-medium')}>{signal.label}</span>}
        {showAccuracy && accuracy != null && (
          <span className={cn(textSize[size], 'text-muted-foreground font-normal')}>
            (±{Math.round(accuracy)}m)
          </span>
        )}
      </span>
    );
  }

  // ── Badge variant (default): pill with background ──
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        badgePadding[size],
        textSize[size],
        signal.badgeClass,
        className
      )}
      title={accuracy != null ? `GPS accuracy: ±${Math.round(accuracy)}m` : 'GPS signal lost'}
    >
      <signal.Icon className={iconSize[size]} />
      {showLabel && <span>{signal.label}</span>}
      {showAccuracy && accuracy != null && (
        <span className="opacity-70">(±{Math.round(accuracy)}m)</span>
      )}
    </span>
  );
};

const iconSize = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

const textSize = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

const badgePadding = {
  sm: 'px-2 py-0.5',
  md: 'px-2.5 py-1',
  lg: 'px-3 py-1.5',
};

const dotSize = {
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
};

function getSignalInfo(accuracy) {
  if (accuracy == null) {
    return {
      label: 'Lost',
      Icon: WifiOff,
      colorClass: 'text-muted-foreground',
      badgeClass: 'bg-muted/30 text-muted-foreground border border-border',
      dotClass: 'bg-muted-foreground',
    };
  }

  const m = Math.round(accuracy);

  if (m <= 10) {
    return {
      label: 'Excellent',
      Icon: Signal,
      colorClass: 'text-success dark:text-success-hover',
      badgeClass: 'bg-success/10 text-success dark:text-success-hover border border-success/20',
      dotClass: 'bg-success',
    };
  }

  if (m <= 30) {
    return {
      label: 'Good',
      Icon: SignalHigh,
      colorClass: 'text-success dark:text-success-hover',
      badgeClass: 'bg-success/10 text-success dark:text-success-hover border border-success/20',
      dotClass: 'bg-success',
    };
  }

  if (m <= 100) {
    return {
      label: 'Fair',
      Icon: SignalMedium,
      colorClass: 'text-warning dark:text-warning-hover',
      badgeClass: 'bg-warning/10 text-warning dark:text-warning-hover border border-warning/20',
      dotClass: 'bg-warning',
    };
  }

  if (m <= 300) {
    return {
      label: 'Weak',
      Icon: SignalLow,
      colorClass: 'text-warning dark:text-warning-hover',
      badgeClass: 'bg-warning/10 text-warning dark:text-warning-hover border border-warning/20',
      dotClass: 'bg-warning',
    };
  }

  return {
    label: 'Poor',
    Icon: SignalZero,
    colorClass: 'text-destructive dark:text-destructive-hover',
    badgeClass: 'bg-destructive/10 text-destructive dark:text-destructive-hover border border-destructive/20',
    dotClass: 'bg-destructive',
  };
}
