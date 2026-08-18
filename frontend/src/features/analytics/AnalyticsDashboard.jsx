import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  PlusCircle, 
  Users, 
  Map, 
  LayoutDashboard, 
  CalendarRange, 
  AlertTriangle, 
  Bell, 
  Clock, 
  Building, 
  ArrowRight, 
  ShieldCheck,
  ClipboardList,
  UserCheck,
  Radio,
  Activity
} from 'lucide-react';
import api from '../../app/api';
import { useAuth } from '../../app/auth-context';
import DashboardKPIs from '../../pages/admin/components/DashboardKPIs';
import DashboardCharts from '../../pages/admin/components/DashboardCharts';
import { Card } from '../../common/components/ui/Card';
import AiOperationsSummary from '../ai/AiOperationsSummary';
import { PageHeader } from '../../common/components/ui/PageHeader';
import { Badge } from '../../common/components/ui/Badge';
import { EmptyState } from '../../common/components/ui/EmptyState';
import { Button } from '../../common/components/ui/Button';
import { TimeAgo } from '../../common/components/ui/TimeAgo';

import ReportExportMenu from '../reports/ReportExportMenu';

function AttentionRequired({ analyticsData }) {
  if (!analyticsData) return null;

  const { workforce } = analyticsData;
  const offlineCount = workforce?.offlineWorkers || 0;
  
  const issues = [];
  if (offlineCount > 0) {
    issues.push({
      type: 'offline',
      severity: 'warning',
      title: 'Telemetry Disconnected',
      message: `${offlineCount} field worker(s) are currently offline or out of GPS coverage.`,
      link: '/admin/tracking',
      linkText: 'Inspect on Live Map'
    });
  }
  
  if (issues.length === 0) {
    return (
      <Card className="h-auto min-h-[140px] bg-surface border-border/70 p-5 flex flex-col justify-center shadow-sm min-w-0 w-full">
        <EmptyState
          icon={ShieldCheck}
          title="All Systems Normal"
          description="Zero operational exceptions or disconnected technicians detected."
          className="py-2 min-h-0"
        />
      </Card>
    );
  }

  return (
    <Card className="h-auto bg-surface border-warning/30 flex flex-col shadow-sm min-w-0 w-full">
      <div className="p-4 border-b border-border/70 flex items-center justify-between min-w-0 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
          <h3 className="text-sm font-bold text-foreground truncate">Attention Required</h3>
        </div>
        <Badge variant="warning" className="text-[10px] shrink-0">
          {issues.length} Alert{issues.length > 1 ? 's' : ''}
        </Badge>
      </div>
      <div className="p-4 space-y-3 flex-1 min-w-0">
        {issues.map((issue, idx) => (
          <div key={idx} className="p-3.5 bg-warning/10 border border-warning/20 rounded-xl text-xs flex flex-col gap-2 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-foreground flex items-center gap-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-warning shrink-0" />
                {issue.title}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase font-semibold shrink-0">Live Alert</span>
            </div>
            <p className="text-muted-foreground leading-relaxed break-words">{issue.message}</p>
            {issue.link && (
              <Link 
                to={issue.link} 
                className="text-primary hover:text-primary-hover font-semibold inline-flex items-center gap-1 mt-1 text-[11px]"
              >
                <span>{issue.linkText}</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

function OperationalTimeline() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const response = await api.get('/notifications');
        setNotifications((response.data?.data?.notifications || []).slice(0, 10));
      } catch (error) {
        console.error('Failed to fetch operational timeline:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const getEventIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'task':
      case 'task_assigned':
      case 'task_completed':
      case 'task:created':
      case 'task:verified':
        return <ClipboardList className="w-3.5 h-3.5 text-primary" />;
      case 'geofence':
      case 'geofence_entry':
      case 'geofence_exit':
        return <Building className="w-3.5 h-3.5 text-warning" />;
      case 'attendance':
      case 'check_in':
      case 'check_out':
      case 'attendance_late':
        return <UserCheck className="w-3.5 h-3.5 text-success" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-info" />;
    }
  };

  return (
    <Card className="h-auto bg-surface border-border/70 flex flex-col shadow-sm min-w-0 w-full">
      <div className="p-4 border-b border-border/70 flex items-center justify-between min-w-0 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Clock className="w-4 h-4 text-primary shrink-0" />
          <h3 className="text-sm font-bold text-foreground truncate">Operational Activity Feed</h3>
        </div>
        <Badge variant="outline" className="text-[10px] shrink-0">Live Feed</Badge>
      </div>

      <div className="flex-1 overflow-y-auto p-3.5 max-h-[460px] custom-scrollbar min-w-0">
        {loading ? (
          <div className="space-y-3 p-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3 items-center animate-pulse">
                <div className="w-6 h-6 rounded-full bg-surface-muted" />
                <div className="space-y-1 flex-1">
                  <div className="h-3 w-3/4 bg-surface-muted rounded" />
                  <div className="h-2 w-1/3 bg-surface-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No Activity Yet"
            description="Operational events and notifications will appear in real time."
            className="py-8"
          />
        ) : (
          <div className="space-y-2.5 min-w-0">
            {notifications.map((n) => (
              <div 
                key={n._id} 
                className="p-3 rounded-xl border border-border/50 bg-background/60 hover:bg-background transition-colors flex items-start gap-3 min-w-0"
              >
                <div className="w-7 h-7 rounded-lg bg-surface flex items-center justify-center shrink-0 border border-border/60 mt-0.5">
                  {getEventIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-xs font-semibold text-foreground leading-snug break-words whitespace-normal">
                    {n.message}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <TimeAgo date={n.createdAt} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

export default function AnalyticsDashboard() {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const response = await api.get('/dashboard/analytics');
        setAnalyticsData(response.data.data);
      } catch (err) {
        // Handled silently for auto-refresh
      }
    }
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formattedDate = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const firstName = user?.name ? user.name.split(' ')[0] : 'Administrator';

  return (
    <div className="space-y-6 min-w-0 w-full pb-10">
      {/* Modernized Command Center Header */}
      <PageHeader
        title={`${getGreeting()}, ${firstName}`}
        description="Operations Command Center · Real-time workforce telemetry, dispatching, and site verification."
        icon={LayoutDashboard}
        actions={
          <div className="flex items-center gap-2.5">
            <ReportExportMenu analyticsData={analyticsData} />
            <div className="hidden sm:flex items-center gap-2 bg-surface/70 border border-border/80 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-muted-foreground shadow-sm">
              <CalendarRange className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="truncate">{formattedDate}</span>
            </div>
          </div>
        }
      />

      {/* Quick Action Navigation Bar */}
      <div className="flex flex-wrap items-center gap-2.5 pt-1 pb-1">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-1">Shortcuts:</span>
        <Button as={Link} to="/admin/dispatch-board" variant="outline" size="sm" className="bg-surface/70 h-8 text-xs font-semibold hover:border-primary/50">
          <PlusCircle className="w-3.5 h-3.5 mr-1.5 text-primary" /> Create Task
        </Button>
        <Button as={Link} to="/admin/users" variant="outline" size="sm" className="bg-surface/70 h-8 text-xs font-semibold hover:border-primary/50">
          <Users className="w-3.5 h-3.5 mr-1.5 text-primary" /> Team Management
        </Button>
        <Button as={Link} to="/admin/tracking" variant="outline" size="sm" className="bg-surface/70 h-8 text-xs font-semibold hover:border-primary/50">
          <Map className="w-3.5 h-3.5 mr-1.5 text-primary" /> Live GIS Tracking
        </Button>
      </div>

      {/* AI Operations Summary Panel */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="min-w-0 w-full"
      >
        <AiOperationsSummary />
      </motion.div>

      {/* Executive KPI Row */}
      <div className="min-w-0 w-full">
        <DashboardKPIs />
      </div>

      {/* Analytics Charts & Operational Feed */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start min-w-0 w-full">
        {/* Left Column (8 cols on XL): Visual Charts */}
        <div className="xl:col-span-8 space-y-6 min-w-0 w-full">
          <DashboardCharts offlineWorkers={analyticsData?.workforce?.offlineWorkers || 0} />
        </div>

        {/* Right Column (4 cols on XL): Attention Required & Timeline */}
        <div className="xl:col-span-4 space-y-6 flex flex-col min-w-0 w-full">
          <AttentionRequired analyticsData={analyticsData} />
          <OperationalTimeline />
        </div>
      </div>
    </div>
  );
}
