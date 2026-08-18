import React, { useState, useEffect, useMemo } from 'react';
import { cn } from './utils';

/**
 * TimeAgo — Displays a timestamp as human-readable relative time.
 *
 * Auto-refreshes every `refreshInterval` ms (default: 30s).
 * Hover shows the full formatted date/time as a native tooltip.
 *
 * @param {object}  props
 * @param {string|number|Date} props.date      - The timestamp to display relative to now.
 * @param {number}  [props.refreshInterval]     - Auto-refresh interval in ms. Default 30000.
 * @param {boolean} [props.showTooltip]         - Show full date on hover. Default true.
 * @param {boolean} [props.live]                - Whether to auto-refresh. Default true.
 * @param {string}  [props.prefix]              - Text before the time ("Updated", "Last ping").
 * @param {string}  [props.suffix]              - Text after the time. Default "ago".
 * @param {string}  [props.fallback]            - Text to show when date is null/undefined.
 * @param {string}  [props.className]           - Additional CSS classes.
 */
export const TimeAgo = ({
  date,
  refreshInterval = 30000,
  showTooltip = true,
  live = true,
  prefix,
  suffix = 'ago',
  fallback = '—',
  className,
}) => {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (!live || !date) return;
    const interval = setInterval(() => forceUpdate((n) => n + 1), refreshInterval);
    return () => clearInterval(interval);
  }, [live, date, refreshInterval]);

  const parsedDate = useMemo(() => {
    if (!date) return null;
    const d = date instanceof Date ? date : new Date(date);
    return isNaN(d.getTime()) ? null : d;
  }, [date]);

  if (!parsedDate) {
    return <span className={cn('text-muted-foreground', className)}>{fallback}</span>;
  }

  const relativeText = formatRelativeTime(parsedDate);
  const fullDate = parsedDate.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const display = [prefix, relativeText, suffix].filter(Boolean).join(' ');

  return (
    <span
      className={cn('text-muted-foreground', className)}
      title={showTooltip ? fullDate : undefined}
    >
      {display}
    </span>
  );
};

/**
 * Converts a Date into a human-readable relative string.
 *
 * Examples:
 *   - "just now"   (< 30s)
 *   - "1 min"      (1 minute)
 *   - "15 min"     (< 1 hour)
 *   - "2h"         (< 24 hours)
 *   - "Yesterday"  (yesterday)
 *   - "3d"         (< 7 days)
 *   - "Aug 4"      (>= 7 days, same year)
 *   - "Aug 4, 2025" (different year)
 */
function formatRelativeTime(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 30) return 'just now';
  if (diffMin < 1) return `${diffSec}s`;
  if (diffMin === 1) return '1 min';
  if (diffMin < 60) return `${diffMin} min`;
  if (diffHr === 1) return '1h';
  if (diffHr < 24) return `${diffHr}h`;

  // Check if it was yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  ) {
    return 'Yesterday';
  }

  if (diffDays < 7) return `${diffDays}d`;

  // Older: show abbreviated date
  const options = { month: 'short', day: 'numeric' };
  if (date.getFullYear() !== now.getFullYear()) {
    options.year = 'numeric';
  }
  return date.toLocaleDateString(undefined, options);
}
