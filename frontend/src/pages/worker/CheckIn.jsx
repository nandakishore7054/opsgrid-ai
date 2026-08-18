import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Clock, 
  CalendarDays, 
  Hourglass, 
  CheckCircle2, 
  MapPin, 
  LogOut, 
  LogIn, 
  Activity,
  AlertTriangle,
  CalendarClock,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import api from '../../app/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../app/auth-context';
import { useLocation } from '../../common/contexts/LocationContext';

import { Card } from '../../common/components/ui/Card';
import { Skeleton } from '../../common/components/ui/Skeleton';
import { PageHeader } from '../../common/components/ui/PageHeader';
import { StatCard } from '../../common/components/ui/StatCard';
import { Button } from '../../common/components/ui/Button';
import { Badge } from '../../common/components/ui/Badge';
import { AlertDialog } from '../../common/components/ui/AlertDialog';

export default function CheckIn() {
  const { user } = useAuth();
  const { getFreshLocation } = useLocation();
  const [currentStatus, setCurrentStatus] = useState('not-checked-in');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [todayRecord, setTodayRecord] = useState(null);
  const [showCheckOutAlert, setShowCheckOutAlert] = useState(false);

  useEffect(() => {
    fetchTodayRecord();
  }, []);

  const fetchTodayRecord = async () => {
    try {
      setLoading(true);
      const res = await api.get('/attendance/me');
      const records = res.data?.data || [];
      
      const today = new Date().toISOString().split('T')[0];
      const recordForToday = records.find(r => r.date && r.date.startsWith(today));
      
      if (recordForToday) {
        setTodayRecord(recordForToday);
        if (recordForToday.checkOut && recordForToday.checkOut.time) {
          setCurrentStatus('checked-out');
        } else if (recordForToday.checkIn && recordForToday.checkIn.time) {
          setCurrentStatus('checked-in');
        } else {
          setCurrentStatus('not-checked-in');
        }
      } else {
        setTodayRecord(null);
        setCurrentStatus('not-checked-in');
      }
    } catch (error) {
      toast.error('Failed to fetch attendance status');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action) => {
    setActionLoading(true);
    
    try {
      const position = await getFreshLocation();
      const { latitude, longitude } = position.coords;
      
      const endpoint = action === 'check-in' ? '/attendance/check-in' : '/attendance/check-out';
      const res = await api.post(endpoint, {
        location: { latitude, longitude },
        method: 'gps',
      });
      toast.success(res.data?.message || `Successfully ${action === 'check-in' ? 'checked in' : 'checked out'}`);
      
      const newRecord = res.data?.data;
      setTodayRecord(newRecord);
      if (newRecord?.checkOut?.time) {
        setCurrentStatus('checked-out');
      } else {
        setCurrentStatus('checked-in');
      }
    } catch (error) {
      console.error('Geolocation/Attendance error:', error);
      if (error.code === 1 || error?.PERMISSION_DENIED) {
        toast.error('Location permission denied. Please enable location services in your browser to verify check-in.');
      } else {
        toast.error(error.response?.data?.message || `Failed to ${action}. Please ensure GPS is available.`);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const isCheckedIn = currentStatus === 'checked-in';
  const isCheckedOut = currentStatus === 'checked-out';
  const notCheckedIn = currentStatus === 'not-checked-in';

  const formatTime = (timeString) => {
    if (!timeString) return '—';
    return new Date(timeString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatElapsedWorkingHours = () => {
    if (!todayRecord?.checkIn?.time) return null;
    const checkInMs = new Date(todayRecord.checkIn.time).getTime();
    const diffMs = Math.max(0, Date.now() - checkInMs);
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m on duty`;
  };

  // Shift progress calculation based strictly on real shift data if available
  let progressPercentage = 0;
  if (isCheckedIn && todayRecord?.checkIn?.time) {
    const checkInTime = new Date(todayRecord.checkIn.time);
    const elapsedMs = Math.max(0, Date.now() - checkInTime);
    
    if (user?.shiftId?.startTime && user?.shiftId?.endTime) {
      const [startH, startM] = user.shiftId.startTime.split(':').map(Number);
      const [endH, endM] = user.shiftId.endTime.split(':').map(Number);
      
      const start = new Date();
      start.setHours(startH, startM, 0);
      
      const end = new Date();
      end.setHours(endH, endM, 0);
      
      let shiftDurationMs = end - start;
      if (shiftDurationMs <= 0) shiftDurationMs = 8 * 60 * 60 * 1000;
      progressPercentage = Math.min(100, Math.max(0, (elapsedMs / shiftDurationMs) * 100));
    }
  } else if (isCheckedOut) {
    progressPercentage = 100;
  }

  const shiftName = user?.shiftId?.name;
  const shiftStartTime = user?.shiftId?.startTime;
  const shiftEndTime = user?.shiftId?.endTime;
  const gracePeriod = user?.shiftId?.gracePeriodMinutes;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-12 w-full">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="lg:col-span-8 h-80 rounded-xl" />
          <Skeleton className="lg:col-span-4 h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 w-full">
      
      {/* Modernized Header with High-Contrast Duty Status */}
      <PageHeader
        title="Shift Check-In & Time Log"
        description="GPS-verified shift arrival, elapsed working duration, and daily time logging."
        icon={Clock}
        actions={
          <div className="flex items-center gap-2">
            {isCheckedIn ? (
              <Badge variant="success" className="text-xs px-3.5 py-1.5 font-bold shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 inline text-success" /> On Duty
              </Badge>
            ) : isCheckedOut ? (
              <Badge variant="outline" className="text-xs px-3.5 py-1.5 font-bold shadow-xs">
                Shift Completed
              </Badge>
            ) : (
              <Badge variant="warning" className="text-xs px-3.5 py-1.5 font-bold shadow-xs">
                Not Checked In
              </Badge>
            )}
          </div>
        }
      />

      {/* Scheduled Shift Context Banner — Full Responsive Width */}
      <Card className="p-6 md:p-7 border-border/70 bg-surface shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Assigned Shift Schedule</span>
            </div>
            <h2 className="text-xl font-extrabold text-foreground tracking-tight">
              {shiftName ? shiftName : 'Schedule not assigned'}
            </h2>
            <p className="text-xs text-muted-foreground">
              {shiftStartTime && shiftEndTime ? (
                <span>Working Hours: <strong className="text-foreground">{shiftStartTime} – {shiftEndTime}</strong> {gracePeriod ? `(${gracePeriod}m grace period)` : ''}</span>
              ) : (
                <span>No shift hours configured for your profile.</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="bg-background border border-border/70 rounded-xl px-5 py-3 shadow-xs text-center flex-1 md:min-w-[140px]">
              <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Logged Hours</div>
              <div className="text-2xl font-extrabold text-foreground mt-0.5">
                {todayRecord?.totalHours ? `${todayRecord.totalHours}h` : (isCheckedIn ? formatElapsedWorkingHours() : '0.0h')}
              </div>
            </div>

            {todayRecord?.overtime ? (
              <div className="bg-success/10 border border-success/20 rounded-xl px-5 py-3 shadow-xs text-center flex-1 md:min-w-[140px]">
                <div className="text-[10px] uppercase font-bold tracking-wider text-success">Overtime</div>
                <div className="text-2xl font-extrabold text-success mt-0.5">{todayRecord.overtime}</div>
              </div>
            ) : null}
          </div>
        </div>
      </Card>

      {/* Operations Grid — 8 cols / 4 cols on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Primary Action & Shift Timeline (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Action Card: Check In / Check Out */}
          {notCheckedIn ? (
            <Card className="p-8 md:p-12 border-border/70 bg-surface shadow-sm text-center flex flex-col items-center justify-center space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
                <LogIn className="w-8 h-8" />
              </div>
              
              <div className="space-y-1.5 max-w-md">
                <h3 className="text-2xl font-extrabold text-foreground tracking-tight">Start Today's Shift</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Your device GPS location will be captured and verified to record your arrival at the job site.
                </p>
              </div>

              <div className="pt-2 w-full max-w-sm">
                <Button
                  onClick={() => handleAction('check-in')}
                  disabled={actionLoading}
                  size="lg"
                  className="w-full min-h-[48px] py-4 text-sm font-bold gap-2.5 shadow-sm touch-manipulation active:scale-[0.99]"
                >
                  {actionLoading ? (
                    <>
                      <Activity className="w-4 h-4 animate-spin" />
                      <span>Acquiring GPS Location...</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4" />
                      <span>Check In With GPS</span>
                    </>
                  )}
                </Button>
              </div>
            </Card>
          ) : isCheckedIn ? (
            <Card className="p-6 md:p-8 border-success/30 bg-surface shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-3.5 border-b border-border/60">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
                  <span className="text-xs font-bold text-success uppercase tracking-wider">Active Shift in Progress</span>
                </div>
                {todayRecord?.status && (
                  <Badge variant={todayRecord.status === 'late' ? 'warning' : 'success'} className="text-[10px] uppercase font-bold">
                    {todayRecord.status}
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                <div className="text-3xl font-black text-foreground">
                  {formatElapsedWorkingHours()}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Checked in at <strong>{formatTime(todayRecord?.checkIn?.time)}</strong>. When your workday ends, complete your duty below.
                </p>
              </div>

              {/* Shift Progress Ring / Bar if shift duration is known */}
              {user?.shiftId?.startTime && user?.shiftId?.endTime && (
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-xs font-bold text-muted-foreground">
                    <span>Shift Progress</span>
                    <span>{Math.round(progressPercentage)}%</span>
                  </div>
                  <div className="w-full bg-surface-muted rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-border/60 flex justify-end">
                <Button
                  onClick={() => setShowCheckOutAlert(true)}
                  disabled={actionLoading}
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto min-h-[44px] gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 font-bold px-5 py-2.5 touch-manipulation active:scale-[0.99]"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Check Out & End Shift</span>
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-7 md:p-8 border-success/30 bg-surface shadow-sm space-y-4">
              <div className="flex items-center gap-3 text-success">
                <CheckCircle2 className="w-6 h-6 shrink-0" />
                <div>
                  <h3 className="text-lg font-bold text-foreground">Shift Successfully Completed</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Checked out today at {formatTime(todayRecord?.checkOut?.time)}. Total logged duration: {todayRecord?.totalHours || '0.0'} hours.
                  </p>
                </div>
              </div>
              <div className="pt-2">
                <Button 
                  as={Link} 
                  to="/worker/dashboard" 
                  variant="outline" 
                  size="sm"
                  className="gap-2 text-xs font-bold"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-primary" />
                  <span>View Tasks Dashboard</span>
                </Button>
              </div>
            </Card>
          )}

          {/* Shift Timeline Visualization */}
          <Card className="p-6 md:p-7 border-border/70 bg-surface shadow-sm">
            <h3 className="text-sm font-bold text-foreground mb-6 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span>Today's Shift Timeline</span>
            </h3>

            <div className="relative border-l-2 border-border/80 ml-3 space-y-7 pb-2">
              
              {/* 1. Scheduled Start Node */}
              <div className="relative pl-6">
                <div className="absolute -left-[9px] top-0.5 w-4 h-4 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center ring-4 ring-background" />
                <div className="text-xs font-bold text-foreground">Shift Schedule</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {shiftStartTime ? `Scheduled start: ${shiftStartTime}` : 'Schedule not assigned'}
                </div>
              </div>

              {/* 2. Check In Node */}
              <div className={`relative pl-6 ${notCheckedIn ? 'opacity-50' : ''}`}>
                <div className={`absolute -left-[9px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center ring-4 ring-background ${
                  todayRecord?.checkIn?.time ? 'bg-success border-2 border-success text-white' : 'bg-surface-muted border-2 border-border'
                }`} />
                <div className="text-xs font-bold text-foreground flex items-center gap-2">
                  <span>Shift Check-In</span>
                  {todayRecord?.status && (
                    <Badge variant={todayRecord.status === 'late' ? 'warning' : 'success'} className="text-[9px] px-1.5 py-0 font-bold">
                      {todayRecord.status === 'late' ? 'Late' : 'On Time'}
                    </Badge>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {todayRecord?.checkIn?.time ? `Recorded at ${formatTime(todayRecord.checkIn.time)}` : 'Pending check-in'}
                </div>
              </div>

              {/* 3. Check Out Node */}
              <div className={`relative pl-6 ${!isCheckedOut ? 'opacity-50' : ''}`}>
                <div className={`absolute -left-[9px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center ring-4 ring-background ${
                  isCheckedOut ? 'bg-primary border-2 border-primary text-white' : 'bg-surface-muted border-2 border-border'
                }`} />
                <div className="text-xs font-bold text-foreground">Shift Check-Out</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {isCheckedOut 
                    ? `Completed at ${formatTime(todayRecord?.checkOut?.time)}` 
                    : (isCheckedIn ? 'On duty (in progress)' : 'Pending')}
                </div>
              </div>

            </div>
          </Card>

        </div>

        {/* Right Column: Attendance Metrics & Field Shortcuts (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Authentic Metrics Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3.5">
            <StatCard
              title="Arrival Time"
              value={formatTime(todayRecord?.checkIn?.time)}
              subtitle={todayRecord?.status ? `Logged as ${todayRecord.status}` : 'Pending arrival'}
              icon={LogIn}
              variant="default"
              colorScheme="primary"
            />

            <StatCard
              title="Departure Time"
              value={formatTime(todayRecord?.checkOut?.time)}
              subtitle={isCheckedOut ? 'Shift ended' : (isCheckedIn ? 'On duty' : 'Pending departure')}
              icon={LogOut}
              variant="default"
              colorScheme={isCheckedOut ? 'success' : 'default'}
            />

            <StatCard
              title="Total Duration"
              value={todayRecord?.totalHours ? `${todayRecord.totalHours} hrs` : (isCheckedIn ? (formatElapsedWorkingHours() || '—') : '—')}
              subtitle="Verified shift duration"
              icon={Hourglass}
              variant="default"
              colorScheme="info"
            />
          </div>

          {/* Quick Shortcuts (Verified Routes) */}
          <Card className="p-5 border-border/70 bg-surface shadow-sm">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3.5">
              Field Navigation
            </h3>
            <div className="space-y-2">
              <Link to="/worker/dashboard">
                <Button variant="outline" className="w-full justify-start gap-2.5 h-11 text-xs font-bold">
                  <LayoutDashboard className="w-4 h-4 text-primary" />
                  <span>My Tasks Dashboard</span>
                </Button>
              </Link>

              <Link to="/worker/my-availability">
                <Button variant="outline" className="w-full justify-start gap-2.5 h-11 text-xs font-bold">
                  <CalendarClock className="w-4 h-4 text-primary" />
                  <span>Request Time-Off</span>
                </Button>
              </Link>

              <Link to="/worker/my-availability">
                <Button variant="outline" className="w-full justify-start gap-2.5 h-11 text-xs font-bold">
                  <CalendarDays className="w-4 h-4 text-primary" />
                  <span>My Weekly Availability</span>
                </Button>
              </Link>

              <Link to="/worker/settings">
                <Button variant="outline" className="w-full justify-start gap-2.5 h-11 text-xs font-bold">
                  <Settings className="w-4 h-4 text-primary" />
                  <span>Account Settings</span>
                </Button>
              </Link>
            </div>
          </Card>

        </div>

      </div>

      {/* Confirmation Modal for Check-Out */}
      <AlertDialog
        isOpen={showCheckOutAlert}
        onClose={() => setShowCheckOutAlert(false)}
        onConfirm={() => {
          setShowCheckOutAlert(false);
          handleAction('check-out');
        }}
        title="Confirm Shift Check-Out"
        description="Are you sure you want to end your current shift? Your GPS location and check-out timestamp will be submitted."
        confirmText="End Shift & Check Out"
        variant="danger"
      />

    </div>
  );
}
