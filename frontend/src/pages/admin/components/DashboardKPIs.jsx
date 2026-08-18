import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, CalendarCheck, Building, Route, WifiOff, CheckCircle2 } from 'lucide-react';
import api from '../../../app/api';
import { StatCard } from '../../../common/components/ui/StatCard';
import { AnimatedCounter } from '../../../common/components/ui/AnimatedCounter';
import { Badge } from '../../../common/components/ui/Badge';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  }
};

export default function DashboardKPIs() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/dashboard/analytics');
      setData(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch dashboard KPIs', err);
      setError('Failed to load KPIs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-destructive text-sm font-medium">
        <p>{error}</p>
      </div>
    );
  }

  const activeCount = data?.workforce?.activeWorkers ?? 0;
  const offlineCount = data?.workforce?.offlineWorkers ?? 0;
  const presentCount = data?.attendance?.presentToday ?? 0;
  const visitsCount = data?.customer?.customerVisitsToday ?? 0;
  const distanceKm = typeof data?.productivity?.totalDistanceToday === 'number' 
    ? data.productivity.totalDistanceToday 
    : parseFloat(data?.productivity?.totalDistanceToday || '0');

  // Calculate attendance percentage if total active workers exists
  const attendanceRate = activeCount > 0 
    ? Math.min(100, Math.round((presentCount / activeCount) * 100)) 
    : null;

  const kpis = [
    { 
      label: 'Active Workforce', 
      value: activeCount, 
      icon: Users,
      colorScheme: 'primary',
      subtitle: offlineCount > 0 ? `${offlineCount} worker(s) offline` : 'All assigned workers active',
      badge: offlineCount > 0 ? (
        <Badge variant="warning" className="text-[10px] px-1.5 py-0">
          <WifiOff className="w-3 h-3 mr-1 inline" /> {offlineCount} Offline
        </Badge>
      ) : (
        <Badge variant="success" className="text-[10px] px-1.5 py-0">
          <CheckCircle2 className="w-3 h-3 mr-1 inline" /> 100% Online
        </Badge>
      ),
      progress: null
    },
    { 
      label: 'Present Today', 
      value: presentCount, 
      icon: CalendarCheck,
      colorScheme: 'info',
      subtitle: attendanceRate !== null ? `${attendanceRate}% verified attendance rate` : 'Shift check-ins today',
      badge: attendanceRate !== null ? (
        <Badge variant="info" className="text-[10px] px-1.5 py-0">
          {attendanceRate}%
        </Badge>
      ) : null,
      progress: attendanceRate
    },
    { 
      label: 'Customer Visits Today', 
      value: visitsCount, 
      icon: Building,
      colorScheme: 'warning',
      subtitle: 'Deterministic geofence arrival logs',
      badge: (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
          Automated
        </Badge>
      ),
      progress: null
    },
    { 
      label: 'Total Distance Travelled', 
      value: `${distanceKm.toFixed(1)} km`, 
      icon: Route,
      colorScheme: 'success',
      subtitle: 'Haversine calculated travel today',
      badge: (
        <Badge variant="success" className="text-[10px] px-1.5 py-0">
          Telemetry
        </Badge>
      ),
      progress: null,
      isStringValue: true
    }
  ];

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 min-w-0 w-full"
    >
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon;
        return (
          <motion.div key={index} variants={itemVariants} className="min-w-0 flex">
            <StatCard 
              title={kpi.label}
              value={
                loading && !data ? '' : (
                  kpi.isStringValue ? (
                    <span>{kpi.value}</span>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <AnimatedCounter value={Number(kpi.value) || 0} />
                    </div>
                  )
                )
              }
              icon={Icon}
              subtitle={kpi.subtitle}
              badge={kpi.badge}
              progress={kpi.progress}
              variant="interactive"
              colorScheme={kpi.colorScheme}
              loading={loading && !data}
            />
          </motion.div>
        );
      })}
    </motion.div>
  );
}
