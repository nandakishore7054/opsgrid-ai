import React, { useState, useEffect, useMemo } from 'react';
import api from '../../app/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { 
  CalendarDays, 
  Users, 
  Clock, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  ChevronRight,
  Filter
} from 'lucide-react';

import AvailabilityGrid from '../../features/availability/AvailabilityGrid';
import LeaveRequestList from '../../features/availability/LeaveRequestList';
import { PageHeader } from '../../common/components/ui/PageHeader';
import { Card } from '../../common/components/ui/Card';
import { Badge } from '../../common/components/ui/Badge';
import { Avatar } from '../../common/components/ui/Avatar';
import { Input } from '../../common/components/ui/Input';
import { Skeleton } from '../../common/components/ui/Skeleton';

const DAYS_META = [
  { index: 1, label: 'Mon', fullName: 'Monday' },
  { index: 2, label: 'Tue', fullName: 'Tuesday' },
  { index: 3, label: 'Wed', fullName: 'Wednesday' },
  { index: 4, label: 'Thu', fullName: 'Thursday' },
  { index: 5, label: 'Fri', fullName: 'Friday' },
  { index: 6, label: 'Sat', fullName: 'Saturday' },
  { index: 0, label: 'Sun', fullName: 'Sunday' },
];

export default function AvailabilityManagement() {
  const [workers, setWorkers] = useState([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState(null);
  const [workerAvailabilities, setWorkerAvailabilities] = useState({});
  const [loading, setLoading] = useState(true);
  const [coverageLoading, setCoverageLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDayFilter, setSelectedDayFilter] = useState(null); // null or day index (0-6)
  const [pendingLeaveCount, setPendingLeaveCount] = useState(0);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Workers
      const workersRes = await api.get('/users/workers');
      const workerList = workersRes.data?.data?.workers || [];
      setWorkers(workerList);

      if (workerList.length > 0) {
        setSelectedWorkerId(workerList[0]._id);
      }

      // 2. Fetch Leave Requests for Pending Count
      try {
        const leaveRes = await api.get('/leave-requests');
        const leaveList = leaveRes.data?.data || [];
        const pending = leaveList.filter(r => r.status === 'pending').length;
        setPendingLeaveCount(pending);
      } catch (_e) {
        // Handled silently
      }

      // 3. Fetch Availabilities across workers for Coverage Overview
      if (workerList.length > 0) {
        setCoverageLoading(true);
        const availMap = {};
        const fetchPromises = workerList.map(async (w) => {
          try {
            const aRes = await api.get(`/availability/${w._id}`);
            availMap[w._id] = aRes.data?.data || [];
          } catch (_err) {
            availMap[w._id] = [];
          }
        });
        await Promise.allSettled(fetchPromises);
        setWorkerAvailabilities(availMap);
        setCoverageLoading(false);
      }

    } catch (error) {
      toast.error('Failed to load workforce availability');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleRefreshSingleWorker = async (wId) => {
    if (!wId) return;
    try {
      const aRes = await api.get(`/availability/${wId}`);
      setWorkerAvailabilities(prev => ({
        ...prev,
        [wId]: aRes.data?.data || []
      }));
    } catch (_err) {
      // Handled silently
    }
  };

  // Calculate actual scheduled headcount per day
  const dailyCoverage = useMemo(() => {
    const totalWorkers = workers.length;
    return DAYS_META.map(day => {
      const scheduledWorkers = workers.filter(w => {
        const schedule = workerAvailabilities[w._id] || [];
        return schedule.some(s => s.dayOfWeek === day.index && s.startTime && s.endTime);
      });

      const count = scheduledWorkers.length;
      const percentage = totalWorkers > 0 ? Math.round((count / totalWorkers) * 100) : 0;

      return {
        ...day,
        count,
        totalWorkers,
        percentage,
        workerIds: scheduledWorkers.map(w => w._id)
      };
    });
  }, [workers, workerAvailabilities]);

  // Filter workers based on search query and optional day filter
  const filteredWorkers = useMemo(() => {
    return workers.filter(w => {
      const matchesSearch = w.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            w.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      if (selectedDayFilter !== null) {
        const schedule = workerAvailabilities[w._id] || [];
        return schedule.some(s => s.dayOfWeek === selectedDayFilter);
      }

      return true;
    });
  }, [workers, searchQuery, selectedDayFilter, workerAvailabilities]);

  const selectedWorker = workers.find(w => w._id === selectedWorkerId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7">
      
      {/* Header with Live Operational Summary */}
      <PageHeader
        title="Workforce Availability & Scheduling"
        description="Configure weekly technician schedules, analyze daily workforce coverage, and review time-off requests."
        icon={CalendarDays}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-surface border border-border/70 rounded-xl px-3.5 py-2 shadow-sm flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Total Technicians</div>
                <div className="text-base font-extrabold text-foreground">{loading ? '—' : workers.length}</div>
              </div>
            </div>

            <div className="bg-surface border border-border/70 rounded-xl px-3.5 py-2 shadow-sm flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-warning/10 text-warning flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Pending Time-Off</div>
                <div className="text-base font-extrabold text-foreground">
                  {pendingLeaveCount > 0 ? (
                    <span className="text-warning">{pendingLeaveCount} Requests</span>
                  ) : (
                    <span className="text-muted-foreground">0 Pending</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        }
      />

      {/* Weekly Team Coverage Overview */}
      <Card className="p-5 md:p-6 border-border/70 bg-surface shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-border/70">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span>Weekly Team Coverage</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Scheduled technician capacity aggregated across all active weekly shifts.
            </p>
          </div>
          {selectedDayFilter !== null && (
            <button
              onClick={() => setSelectedDayFilter(null)}
              className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Clear Day Filter ({DAYS_META.find(d => d.index === selectedDayFilter)?.fullName})</span>
            </button>
          )}
        </div>

        {coverageLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-3 min-w-0 w-full">
            {[...Array(7)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-3 min-w-0 w-full">
            {dailyCoverage.map((day) => {
              const isSelected = selectedDayFilter === day.index;
              const isCurrentDayOfWeek = new Date().getDay() === day.index;

              return (
                <button
                  key={day.index}
                  type="button"
                  onClick={() => setSelectedDayFilter(isSelected ? null : day.index)}
                  className={`p-3.5 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between ${
                    isSelected
                      ? 'border-primary bg-primary/10 ring-2 ring-primary/40 shadow-sm'
                      : 'border-border/60 bg-background hover:bg-surface-muted/40 hover:border-border'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className={`text-xs font-bold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                      {day.label}
                    </span>
                    {isCurrentDayOfWeek && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" title="Today" />
                    )}
                  </div>

                  <div className="space-y-1.5 w-full">
                    <div className="text-sm font-extrabold text-foreground">
                      {day.count} <span className="text-[11px] font-normal text-muted-foreground">/ {day.totalWorkers}</span>
                    </div>
                    
                    {/* Coverage Ratio Bar */}
                    <div className="w-full bg-surface-muted rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${day.count > 0 ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                        style={{ width: `${day.percentage}%` }}
                      />
                    </div>

                    <div className="text-[10px] text-muted-foreground font-medium truncate">
                      {day.count === 1 ? '1 scheduled' : `${day.count} scheduled`}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {/* Main Operations Grid: Technician Selector + Schedule Editor + Leave Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        
        {/* Left Column: Technician Selection & Availability Grid (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-5 md:p-6 border-border/70 bg-surface shadow-sm">
            
            {/* Technician Search & Selection Header */}
            <div className="space-y-3 pb-5 mb-5 border-b border-border/70">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span>Select Field Technician</span>
                </h3>
                <Badge variant="outline" className="text-xs">
                  {filteredWorkers.length} {filteredWorkers.length === 1 ? 'technician' : 'technicians'}
                </Badge>
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search technicians by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 rounded-xl bg-background border border-border/70 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                />
              </div>

              {/* Technician Cards Selector */}
              {loading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-xl" />
                  ))}
                </div>
              ) : filteredWorkers.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground bg-background rounded-xl border border-dashed border-border/70">
                  No technicians match the selected filter.
                </div>
              ) : (
                <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {filteredWorkers.map((w) => {
                    const isSelected = selectedWorkerId === w._id;
                    const scheduledDays = (workerAvailabilities[w._id] || []).length;

                    return (
                      <button
                        key={w._id}
                        type="button"
                        onClick={() => setSelectedWorkerId(w._id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-primary/50 bg-primary/5 ring-1 ring-primary shadow-xs'
                            : 'border-border/50 bg-background hover:bg-surface-muted/30'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar 
                            src={w.avatarUrl} 
                            fallback={w.name || 'T'} 
                            size="sm" 
                          />
                          <div className="truncate">
                            <div className="text-xs font-bold text-foreground truncate">{w.name}</div>
                            <div className="text-[10px] text-muted-foreground truncate">{w.email}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className="text-[10px] px-2 py-0">
                            {scheduledDays} {scheduledDays === 1 ? 'day' : 'days'}
                          </Badge>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Availability Schedule Editor for Selected Worker */}
            {selectedWorkerId && (
              <div>
                {selectedWorker && (
                  <div className="mb-4 p-3 rounded-xl bg-surface-muted/40 border border-border/60 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Avatar src={selectedWorker.avatarUrl} fallback={selectedWorker.name} size="sm" />
                      <div>
                        <div className="text-xs font-bold text-foreground">{selectedWorker.name}</div>
                        <div className="text-[10px] text-muted-foreground">Configuring weekly operational availability</div>
                      </div>
                    </div>
                    <Badge variant="primary" className="text-[10px]">Active Shift Editor</Badge>
                  </div>
                )}

                <AvailabilityGrid 
                  workerId={selectedWorkerId} 
                  onSaveSuccess={() => handleRefreshSingleWorker(selectedWorkerId)}
                />
              </div>
            )}

          </Card>
        </div>

        {/* Right Column: Time-Off / Leave Requests Management (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <LeaveRequestList 
            isAdmin={true} 
            onStatusUpdated={fetchInitialData}
          />
        </div>

      </div>

    </div>
  );
}
