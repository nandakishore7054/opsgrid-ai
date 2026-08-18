import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../app/api';
import { Card } from '../../common/components/ui/Card';
import { Button } from '../../common/components/ui/Button';
import { Skeleton } from '../../common/components/ui/Skeleton';
import { Badge } from '../../common/components/ui/Badge';
import { CalendarDays, Save, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const DAYS_OF_WEEK = [
  { index: 1, name: 'Monday' },
  { index: 2, name: 'Tuesday' },
  { index: 3, name: 'Wednesday' },
  { index: 4, name: 'Thursday' },
  { index: 5, name: 'Friday' },
  { index: 6, name: 'Saturday' },
  { index: 0, name: 'Sunday' },
];

export default function AvailabilityGrid({ workerId = 'me', readOnly = false, onSaveSuccess }) {
  const [availabilities, setAvailabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // default grid state for all 7 days (0 to 6)
  const [grid, setGrid] = useState(
    [0, 1, 2, 3, 4, 5, 6].map((dayIndex) => ({
      dayOfWeek: dayIndex,
      isAvailable: false,
      startTime: '09:00',
      endTime: '17:00',
    }))
  );

  useEffect(() => {
    fetchAvailability();
  }, [workerId]);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const endpoint = workerId === 'me' ? '/availability/me' : `/availability/${workerId}`;
      const res = await api.get(endpoint);
      const data = res.data?.data || [];
      setAvailabilities(data);

      const newGrid = [0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
        const existing = data.find((a) => a.dayOfWeek === dayIndex);
        if (existing) {
          return {
            dayOfWeek: dayIndex,
            isAvailable: true,
            startTime: existing.startTime || '09:00',
            endTime: existing.endTime || '17:00',
          };
        }
        return {
          dayOfWeek: dayIndex,
          isAvailable: false,
          startTime: '09:00',
          endTime: '17:00',
        };
      });
      setGrid(newGrid);
    } catch (error) {
      toast.error('Failed to load availability schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDay = (dayOfWeek) => {
    if (readOnly) return;
    setGrid((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, isAvailable: !d.isAvailable } : d))
    );
  };

  const handleTimeChange = (dayOfWeek, field, value) => {
    if (readOnly) return;
    setGrid((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, [field]: value } : d))
    );
  };

  const handleSave = async () => {
    const payload = grid
      .filter((d) => d.isAvailable)
      .map((d) => ({
        dayOfWeek: d.dayOfWeek,
        startTime: d.startTime,
        endTime: d.endTime,
        isRecurring: true,
      }));

    try {
      setSaving(true);
      const endpoint = workerId === 'me' ? '/availability/me' : `/availability/${workerId}`;
      await api.put(endpoint, { availabilities: payload });
      toast.success('Weekly availability schedule saved');
      fetchAvailability();
      if (onSaveSuccess) onSaveSuccess();
    } catch (error) {
      const errorMsg = error.response?.data?.error?.message || 
                       error.response?.data?.error?.details?.time?.[0] || 
                       'Failed to save availability';
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const activeDaysCount = grid.filter(d => d.isAvailable).length;

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-20" />
        </div>
        {[...Array(7)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-border/70">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-foreground">Weekly Shift Schedule</span>
        </div>
        <Badge variant={activeDaysCount > 0 ? "primary" : "outline"} className="text-xs">
          {activeDaysCount} {activeDaysCount === 1 ? 'day' : 'days'} scheduled
        </Badge>
      </div>

      <div className="space-y-2.5">
        {DAYS_OF_WEEK.map((dayObj, idx) => {
          const day = grid.find((d) => d.dayOfWeek === dayObj.index) || {
            dayOfWeek: dayObj.index,
            isAvailable: false,
            startTime: '09:00',
            endTime: '17:00'
          };

          return (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              key={dayObj.index}
              className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border transition-all duration-200 ${
                day.isAvailable
                  ? 'border-primary/40 bg-primary/5 shadow-sm'
                  : 'border-border/60 bg-background hover:bg-surface-muted/30'
              }`}
            >
              {/* Day Name and Toggle Switch */}
              <div className="flex items-center gap-3 mb-2.5 sm:mb-0">
                <button
                  type="button"
                  onClick={() => handleToggleDay(day.dayOfWeek)}
                  disabled={readOnly}
                  aria-label={`Toggle availability for ${dayObj.name}`}
                  className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all border ${
                    day.isAvailable 
                      ? 'bg-primary border-primary text-primary-foreground shadow-sm' 
                      : 'bg-surface border-border text-transparent hover:border-primary/50'
                  } ${readOnly ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
                <div>
                  <span className={`font-bold text-sm ${day.isAvailable ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {dayObj.name}
                  </span>
                  <div className="text-[11px] text-muted-foreground">
                    {day.isAvailable ? 'Available for dispatch' : 'Off duty'}
                  </div>
                </div>
              </div>

              {/* Time Configuration Inputs */}
              {day.isAvailable ? (
                <div className="flex items-center gap-2 bg-surface p-1.5 rounded-lg border border-border/70 shadow-sm">
                  <div className="relative flex items-center">
                    <Clock className="absolute left-2.5 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      type="time"
                      value={day.startTime}
                      onChange={(e) => handleTimeChange(day.dayOfWeek, 'startTime', e.target.value)}
                      disabled={readOnly}
                      aria-label={`${dayObj.name} start time`}
                      className="h-8 w-28 pl-8 pr-2 rounded-md bg-transparent text-xs font-semibold text-foreground outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                    />
                  </div>
                  <span className="text-muted-foreground text-[10px] font-bold uppercase">to</span>
                  <div className="relative flex items-center">
                    <Clock className="absolute left-2.5 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      type="time"
                      value={day.endTime}
                      onChange={(e) => handleTimeChange(day.dayOfWeek, 'endTime', e.target.value)}
                      disabled={readOnly}
                      aria-label={`${dayObj.name} end time`}
                      className="h-8 w-28 pl-8 pr-2 rounded-md bg-transparent text-xs font-semibold text-foreground outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-muted-foreground/70 text-xs font-medium px-2 py-1">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Not Scheduled</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {!readOnly && (
        <div className="pt-3 border-t border-border/60 flex justify-end">
          <Button
            onClick={handleSave}
            isLoading={saving}
            className="gap-2 shadow-sm"
            size="sm"
          >
            <Save className="w-4 h-4" />
            <span>Save Schedule</span>
          </Button>
        </div>
      )}
    </div>
  );
}
