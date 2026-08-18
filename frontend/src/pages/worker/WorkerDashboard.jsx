import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MapPin, 
  Clock, 
  CalendarDays, 
  Settings, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  Briefcase, 
  ArrowRight,
  Sparkles,
  CalendarClock,
  UserCheck,
  Building
} from 'lucide-react';

import api from '../../app/api';
import WorkerTaskList from '../../features/tasks/WorkerTaskList';
import { useAuth } from '../../app/auth-context';
import { PageHeader } from '../../common/components/ui/PageHeader';
import { Avatar } from '../../common/components/ui/Avatar';
import { StatCard } from '../../common/components/ui/StatCard';
import { Card } from '../../common/components/ui/Card';
import { Badge } from '../../common/components/ui/Badge';
import { Button } from '../../common/components/ui/Button';
import { EmptyState } from '../../common/components/ui/EmptyState';

export default function WorkerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  
  const [todayRecord, setTodayRecord] = useState(null);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('today');

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoadingTasks(true);
      setLoadingAttendance(true);
      setError('');

      try {
        const [tasksRes, attendanceRes] = await Promise.all([
          api.get('/tasks/my-tasks'),
          api.get('/attendance/me')
        ]);

        if (isMounted) {
          setTasks(tasksRes.data?.data?.tasks || []);
          
          const records = attendanceRes.data?.data || [];
          const todayStr = new Date().toISOString().split('T')[0];
          const recordForToday = records.find(r => r.date?.startsWith(todayStr));
          setTodayRecord(recordForToday || null);
        }
      } catch (err) {
        if (isMounted) {
          setError('Unable to load your technician dashboard data.');
        }
      } finally {
        if (isMounted) {
          setLoadingTasks(false);
          setLoadingAttendance(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const now = new Date();
  const todayStr = now.toDateString();

  // 1. Task Classification & Business Logic Preservation
  const todayTasks = useMemo(() => {
    return tasks.filter(task => {
      if (!task.deadline) return true;
      const deadlineDate = new Date(task.deadline);
      return deadlineDate <= now || deadlineDate.toDateString() === todayStr;
    });
  }, [tasks, now, todayStr]);

  const completedTasks = todayTasks.filter(t => t.status === 'completed' || t.status === 'verified');
  const pendingTasks = todayTasks.filter(t => t.status !== 'completed' && t.status !== 'verified' && t.status !== 'rejected');
  
  const highPriorityCount = pendingTasks.filter(t => t.priority === 'high' || t.priority === 'urgent').length;
  
  // Find current priority task
  const currentTask = pendingTasks.slice().sort((a, b) => {
    if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
    if (b.status === 'in_progress' && a.status !== 'in_progress') return 1;
    const priorityWeight = { urgent: 3, high: 2, medium: 1, low: 0 };
    return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
  })[0];

  const completionPercentage = todayTasks.length > 0 
    ? Math.round((completedTasks.length / todayTasks.length) * 100) 
    : 0;

  // 2. Attendance Status & Duration
  const isCheckedIn = Boolean(todayRecord?.checkIn?.time && !todayRecord?.checkOut?.time);
  const isCheckedOut = Boolean(todayRecord?.checkOut?.time);

  const formatElapsedWorkingHours = () => {
    if (!todayRecord?.checkIn?.time) return null;
    const checkInMs = new Date(todayRecord.checkIn.time).getTime();
    const diffMs = Math.max(0, Date.now() - checkInMs);
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m on duty`;
  };

  // 3. Greeting Context
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const workerFirstName = user?.name ? user.name.split(' ')[0] : 'Technician';
  const shiftLabel = user?.shiftId?.name || 'Current Shift';

  // 4. Tab Queue Filter
  const getFilteredTasks = () => {
    return tasks.filter(task => {
      const isCompleted = task.status === 'completed' || task.status === 'verified' || task.status === 'rejected';
      if (activeTab === 'completed') return isCompleted;
      if (isCompleted) return false;

      if (activeTab === 'today') {
        if (!task.deadline) return true;
        const deadlineDate = new Date(task.deadline);
        return deadlineDate <= now || deadlineDate.toDateString() === todayStr;
      }

      if (activeTab === 'upcoming') {
        if (!task.deadline) return false;
        const deadlineDate = new Date(task.deadline);
        return deadlineDate > now && deadlineDate.toDateString() !== todayStr;
      }

      return true;
    });
  };

  const filteredTasks = getFilteredTasks();

  // Tab Count Badges
  const upcomingCount = tasks.filter(t => {
    const isCompleted = t.status === 'completed' || t.status === 'verified' || t.status === 'rejected';
    if (isCompleted || !t.deadline) return false;
    const deadlineDate = new Date(t.deadline);
    return deadlineDate > now && deadlineDate.toDateString() !== todayStr;
  }).length;

  const allCompletedCount = tasks.filter(t => t.status === 'completed' || t.status === 'verified' || t.status === 'rejected').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Top Hero Banner & Personalized Greeting */}
      <Card className="p-6 md:p-7 border-border/70 bg-surface shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          
          <div className="flex items-center gap-4">
            <Avatar 
              src={user?.avatarUrl} 
              fallback={user?.name || 'T'} 
              size="2xl" 
              className="border-2 border-border/80 shadow-sm"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  {greeting}, {workerFirstName}
                </h1>
                {isCheckedIn && (
                  <span className="w-2.5 h-2.5 rounded-full bg-success" title="On Duty" />
                )}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground flex flex-wrap items-center gap-2">
                <span>{now.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <Badge variant="outline" className="text-[11px] py-0 font-medium">
                  {shiftLabel}
                </Badge>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="bg-background border border-border/70 rounded-xl px-4 py-2.5 shadow-sm text-center flex-1 md:min-w-[100px]">
              <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Today's Tasks</div>
              <div className="text-xl font-extrabold text-foreground mt-0.5">{todayTasks.length}</div>
            </div>

            <div className="bg-background border border-border/70 rounded-xl px-4 py-2.5 shadow-sm text-center flex-1 md:min-w-[100px]">
              <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Completed</div>
              <div className="text-xl font-extrabold text-success mt-0.5">{completedTasks.length}</div>
            </div>

            {highPriorityCount > 0 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-2.5 shadow-sm text-center flex-1 md:min-w-[100px]">
                <div className="text-[10px] uppercase font-bold tracking-wider text-destructive">Urgent</div>
                <div className="text-xl font-extrabold text-destructive mt-0.5">{highPriorityCount}</div>
              </div>
            )}
          </div>

        </div>
      </Card>

      {/* Main Operations Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start min-w-0 w-full">
        
        {/* Left Column (8 cols on XL): Current Up Next Task + Task Completion Progress */}
        <div className="xl:col-span-8 space-y-6 min-w-0 w-full">
          
          {/* Priority / Up Next Task Card */}
          {currentTask ? (
            <Card className="p-6 border-primary/40 bg-surface shadow-sm relative overflow-hidden min-w-0 w-full">
              <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-border/60 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
                  <span className="text-xs font-bold text-primary uppercase tracking-wider truncate">Up Next For You</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {currentTask.priority && (
                    <Badge variant={currentTask.priority === 'urgent' ? 'destructive' : currentTask.priority === 'high' ? 'warning' : 'info'} className="text-[10px] uppercase">
                      {currentTask.priority} Priority
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {currentTask.status?.replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3 min-w-0">
                <h2 className="text-lg font-bold text-foreground leading-snug break-words">
                  {currentTask.title}
                </h2>

                {currentTask.description && (
                  <p className="text-xs text-muted-foreground break-words leading-relaxed whitespace-normal">
                    {currentTask.description}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 min-w-0">
                  {currentTask.customer?.name && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background p-2.5 rounded-xl border border-border/50 min-w-0">
                      <Building className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate">{currentTask.customer.name}</span>
                    </div>
                  )}

                  {(currentTask.locationAddress || currentTask.location?.address) && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background p-2.5 rounded-xl border border-border/50 min-w-0">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate">{currentTask.locationAddress || currentTask.location?.address}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-border/60 flex justify-end">
                  <Button 
                    as={Link} 
                    to={`/worker/tasks/${currentTask._id}`}
                    size="sm"
                    className="gap-2 shadow-sm font-semibold"
                  >
                    <span>{currentTask.status === 'in_progress' ? 'Resume Task' : 'Open Task Details'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-6 border-border/70 bg-surface shadow-sm min-w-0 w-full">
              <EmptyState 
                icon={Briefcase}
                title="You're All Caught Up!"
                description="No active tasks are currently assigned to you. Enjoy your shift or check upcoming assignments."
                className="py-4"
              />
            </Card>
          )}

          {/* Today's Task Completion Progress Card */}
          <StatCard 
            title="Today's Work Orders"
            value={`${completedTasks.length} / ${todayTasks.length} Completed`}
            subtitle={`${completionPercentage}% of today's assigned tasks completed`}
            progress={completionPercentage}
            loading={loadingTasks}
            colorScheme="primary"
          />

        </div>

        {/* Right Column (4 cols on XL): Shift Status & Quick Actions */}
        <div className="xl:col-span-4 space-y-6 min-w-0 w-full">
          
          {/* Shift Status Card */}
          <Card className="p-5 md:p-6 border-border/70 bg-surface shadow-sm min-w-0 w-full">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-border/70">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Shift Status</h3>
              </div>
              {isCheckedIn ? (
                <Badge variant="success" className="text-[10px]">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> On Duty
                </Badge>
              ) : isCheckedOut ? (
                <Badge variant="outline" className="text-[10px]">
                  Shift Ended
                </Badge>
              ) : (
                <Badge variant="warning" className="text-[10px]">
                  Not Checked In
                </Badge>
              )}
            </div>

            <div className="space-y-4">
              {isCheckedIn ? (
                <div className="space-y-2">
                  <div className="p-3 bg-success/10 border border-success/20 rounded-xl">
                    <div className="text-xs font-bold text-success">
                      Checked in at {new Date(todayRecord.checkIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {formatElapsedWorkingHours()}
                    </div>
                  </div>
                  <Button 
                    as={Link} 
                    to="/worker/check-in" 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-xs font-semibold justify-center"
                  >
                    View Shift & Attendance
                  </Button>
                </div>
              ) : isCheckedOut ? (
                <div className="space-y-2">
                  <div className="p-3 bg-surface-muted/40 border border-border/60 rounded-xl">
                    <div className="text-xs font-bold text-foreground">Shift Completed</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {todayRecord?.totalHours ? `${todayRecord.totalHours} hours recorded today` : 'Check-out recorded'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    You have not checked in for today's shift yet. Check in with GPS verification to start your duty.
                  </p>
                  <Button 
                    as={Link} 
                    to="/worker/check-in" 
                    size="sm" 
                    className="w-full text-xs font-semibold justify-center"
                  >
                    Check In Now
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Quick Actions Shortcuts (Verified Routes) */}
          <Card className="p-5 border-border/70 bg-surface shadow-sm">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
              Field Shortcuts
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              <Link 
                to="/worker/check-in" 
                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-border/60 bg-background hover:bg-surface-muted hover:border-primary/40 transition-all text-foreground hover:text-primary text-center group shadow-xs"
              >
                <UserCheck className="w-5 h-5 text-primary group-hover:scale-105 transition-transform" />
                <span className="text-xs font-bold">Check In / Out</span>
              </Link>

              <Link 
                to="/worker/my-availability" 
                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-border/60 bg-background hover:bg-surface-muted hover:border-primary/40 transition-all text-foreground hover:text-primary text-center group shadow-xs"
              >
                <CalendarDays className="w-5 h-5 text-primary group-hover:scale-105 transition-transform" />
                <span className="text-xs font-bold">My Schedule</span>
              </Link>

              <Link 
                to="/worker/my-availability" 
                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-border/60 bg-background hover:bg-surface-muted hover:border-primary/40 transition-all text-foreground hover:text-primary text-center group shadow-xs"
              >
                <CalendarClock className="w-5 h-5 text-primary group-hover:scale-105 transition-transform" />
                <span className="text-xs font-bold">Time-Off</span>
              </Link>

              <Link 
                to="/worker/settings" 
                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-border/60 bg-background hover:bg-surface-muted hover:border-primary/40 transition-all text-foreground hover:text-primary text-center group shadow-xs"
              >
                <Settings className="w-5 h-5 text-primary group-hover:scale-105 transition-transform" />
                <span className="text-xs font-bold">Settings</span>
              </Link>
            </div>
          </Card>

        </div>

      </div>

      {/* Task Queue Section with Modernized Tabs */}
      <div className="pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            <span>My Task Queue</span>
          </h2>
        </div>

        {/* Tab Selection Bar */}
        <div 
          role="tablist" 
          aria-label="Task queue filters"
          className="flex flex-wrap items-center gap-2 p-1 bg-surface border border-border/70 rounded-xl shadow-xs"
        >
          {[
            { id: 'today', label: "Today's Tasks", count: pendingTasks.length },
            { id: 'upcoming', label: 'Upcoming', count: upcomingCount },
            { id: 'completed', label: 'Completed', count: allCompletedCount }
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-surface-muted/50'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  isSelected 
                    ? 'bg-primary-foreground/20 text-primary-foreground' 
                    : 'bg-surface-muted text-muted-foreground'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Task List Grid */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <WorkerTaskList 
            tasks={filteredTasks} 
            loading={loadingTasks} 
            error={error} 
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </motion.div>
      </div>

    </div>
  );
}