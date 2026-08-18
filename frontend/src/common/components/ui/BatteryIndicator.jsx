import React from 'react';
import { cn } from './utils';
import {
  BatteryFull,
  BatteryMedium,
  BatteryLow,
  BatteryWarning,
  BatteryCharging,
  Battery,
} from 'lucide-react';

/**
 * BatteryIndicator — Visual battery level display with color coding.
 *
 * Thresholds:
 *   - ≥ 80%  → Green  (Full)
 *   - ≥ 50%  → Green  (Medium)
 *   - ≥ 25%  → Yellow (Low)
 *   - ≥ 10%  → Red    (Warning)
 *   - < 10%  → Red    (Critical)
 *
 * @param {object}  props
 * @param {number}  props.level            - Battery level 0–100.
 * @param {boolean} [props.charging]       - Show charging icon. Default false.
 * @param {boolean} [props.showLabel]      - Display percentage text. Default true.
 * @param {"sm"|"md"|"lg"} [props.size]    - Icon size. Default "sm".
 * @param {string}  [props.className]      - Additional CSS classes.
 */
export const BatteryIndicator = ({
  level,
  charging = false,
  showLabel = true,
  size = 'sm',
  className,
}) => {
  const safeLevel = typeof level === 'number' ? Math.max(0, Math.min(100, Math.round(level))) : null;

  if (safeLevel === null || safeLevel === undefined) {
    return (
      <span className={cn('inline-flex items-center gap-1 text-muted-foreground', className)}>
        <Battery className={iconSize[size]} />
        {showLabel && <span className={textSize[size]}>—</span>}
      </span>
    );
  }

  const { Icon, colorClass, label } = getBatteryMeta(safeLevel, charging);

  return (
    <span
      className={cn('inline-flex items-center gap-1', colorClass, className)}
      title={`Battery: ${safeLevel}%${charging ? ' (charging)' : ''}`}
    >
      <Icon className={iconSize[size]} />
      {showLabel && <span className={cn(textSize[size], 'font-medium')}>{safeLevel}%</span>}
    </span>
  );
};

const iconSize = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

const textSize = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

function getBatteryMeta(level, charging) {
  if (charging) {
    return {
      Icon: BatteryCharging,
      colorClass: 'text-info',
      label: 'Charging',
    };
  }

  if (level >= 80) {
    return {
      Icon: BatteryFull,
      colorClass: 'text-success dark:text-success-hover',
      label: 'Full',
    };
  }

  if (level >= 50) {
    return {
      Icon: BatteryMedium,
      colorClass: 'text-success dark:text-success-hover',
      label: 'Good',
    };
  }

  if (level >= 25) {
    return {
      Icon: BatteryLow,
      colorClass: 'text-warning dark:text-warning-hover',
      label: 'Low',
    };
  }

  if (level >= 10) {
    return {
      Icon: BatteryWarning,
      colorClass: 'text-destructive dark:text-destructive-hover',
      label: 'Low',
    };
  }

  return {
    Icon: BatteryWarning,
    colorClass: 'text-destructive dark:text-destructive-hover',
    label: 'Critical',
  };
}
