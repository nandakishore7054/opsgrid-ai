import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, PieChart as PieChartIcon, Map, Activity } from 'lucide-react';
import api from '../../../app/api';
import { Card } from '../../../common/components/ui/Card';
import { Badge } from '../../../common/components/ui/Badge';
import { EmptyState } from '../../../common/components/ui/EmptyState';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
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

export default function DashboardCharts({ offlineWorkers = 0 }) {
  const [chartsData, setChartsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    let intervalId;

    async function fetchCharts(isAuto = false) {
      if (!isAuto) setLoading(true);
      try {
        const response = await api.get('/dashboard/charts');
        if (isMounted) {
          setChartsData(response.data?.data);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to load dashboard charts', err);
        if (isMounted && !isAuto) setError('Failed to load charts');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchCharts();
    intervalId = setInterval(() => fetchCharts(true), 30000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  if (loading && !chartsData) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full min-w-0">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="p-6 min-h-[380px] h-auto bg-surface/50 border-border/60">
             <div className="flex items-center gap-3 mb-6">
               <div className="w-9 h-9 bg-surface-muted rounded-xl animate-pulse" />
               <div className="h-4 w-36 bg-surface-muted rounded animate-pulse" />
             </div>
             <div className="h-[260px] w-full bg-surface-muted/40 rounded-xl animate-pulse" />
          </Card>
        ))}
      </div>
    );
  }

  if (error && !chartsData) {
    return (
      <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-destructive text-sm font-medium">
        <p>{error}</p>
      </div>
    );
  }

  if (!chartsData) return null;

  const { customerVisitsPerDay, attendanceDistribution, workerDistanceTravelled, distanceTrend } = chartsData;
  
  const getAttendanceCount = (name) => {
    const item = attendanceDistribution?.find(a => a.name === name);
    return item ? item.value : 0;
  };

  const presentCount = getAttendanceCount('On Time') + getAttendanceCount('Late');
  const absentCount = getAttendanceCount('Absent');
  const lateCount = getAttendanceCount('Late');

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface/95 border border-border px-3.5 py-2.5 rounded-xl shadow-lg backdrop-blur-md text-xs">
          <p className="text-muted-foreground font-semibold mb-1.5">{label || payload[0].name}</p>
          <div className="space-y-1">
            {payload.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
                 <span className="text-foreground font-medium">
                   {entry.name}: <span className="font-bold">{entry.value}</span>
                 </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-2 gap-6 min-w-0 w-full"
    >
      
      {/* 1. Customer Visits Per Day */}
      <motion.div variants={itemVariants} className="min-w-0 flex flex-col">
        <Card className="p-5 md:p-6 min-h-[380px] h-auto flex flex-col bg-surface border-border/70 shadow-sm min-w-0 w-full">
          <div className="flex items-start justify-between gap-3 mb-5 min-w-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-foreground tracking-tight truncate">Customer Visits</h3>
                <p className="text-xs text-muted-foreground truncate">Automated geofenced site visits (Last 7 Days)</p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] shrink-0">7-Day Window</Badge>
          </div>

          <div className="flex-1 w-full min-h-[260px] min-w-0">
            {customerVisitsPerDay?.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={customerVisitsPerDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border/40" vertical={false} />
                  <XAxis dataKey="date" stroke="currentColor" className="text-muted-foreground text-[11px]" tickFormatter={(val) => val.split('-').slice(1).join('/')} tickMargin={8} axisLine={false} tickLine={false} />
                  <YAxis stroke="currentColor" className="text-muted-foreground text-[11px]" allowDecimals={false} tickMargin={8} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'currentColor', strokeWidth: 1, strokeDasharray: '3 3', className: 'text-border' }} />
                  <Line type="monotone" dataKey="visits" name="Visits" stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 3.5, fill: '#0ea5e9', strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} animationDuration={800} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-6">
                <EmptyState
                  icon={BarChart3}
                  title="No Visit Records"
                  description="Geofence visit events will display here once recorded."
                  className="py-4"
                />
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* 2. Workforce Health & Attendance */}
      <motion.div variants={itemVariants} className="min-w-0 flex flex-col">
        <Card className="p-5 md:p-6 min-h-[380px] h-auto flex flex-col bg-surface border-border/70 shadow-sm min-w-0 w-full">
          <div className="flex items-start justify-between gap-3 mb-4 min-w-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-info/10 flex items-center justify-center text-info shrink-0">
                <PieChartIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-foreground tracking-tight truncate">Shift Attendance</h3>
                <p className="text-xs text-muted-foreground truncate">Today's verified check-in breakdown</p>
              </div>
            </div>
            <Badge variant="info" className="text-[10px] shrink-0">Today</Badge>
          </div>

          <div className="flex-1 flex flex-col sm:flex-row items-center min-h-[260px] gap-4 min-w-0">
            <div className="w-full sm:w-1/2 h-[220px] min-w-0 flex items-center justify-center">
              {attendanceDistribution?.some(a => a.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<CustomTooltip />} />
                    <Pie
                      data={attendanceDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                      animationDuration={800}
                      stroke="none"
                    >
                      {attendanceDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill || '#0ea5e9'} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center">
                  <EmptyState
                    icon={PieChartIcon}
                    title="No Check-Ins"
                    description="Attendance distribution will populate today."
                    className="py-2"
                  />
                </div>
              )}
            </div>

            <div className="w-full sm:w-1/2 grid grid-cols-2 gap-2.5 min-w-0">
              <div className="bg-surface-muted/30 p-2.5 rounded-xl border border-border/70 flex flex-col min-w-0">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider truncate">Present</span>
                <span className="text-xl font-bold text-success mt-0.5">{presentCount}</span>
              </div>
              <div className="bg-surface-muted/30 p-2.5 rounded-xl border border-border/70 flex flex-col min-w-0">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider truncate">Absent</span>
                <span className="text-xl font-bold text-destructive mt-0.5">{absentCount}</span>
              </div>
              <div className="bg-surface-muted/30 p-2.5 rounded-xl border border-border/70 flex flex-col min-w-0">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider truncate">Late</span>
                <span className="text-xl font-bold text-warning mt-0.5">{lateCount}</span>
              </div>
              <div className="bg-surface-muted/30 p-2.5 rounded-xl border border-border/70 flex flex-col min-w-0">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider truncate">Offline</span>
                <span className="text-xl font-bold text-muted-foreground mt-0.5">{offlineWorkers}</span>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* 3. Top Worker Distances */}
      <motion.div variants={itemVariants} className="min-w-0 flex flex-col">
        <Card className="p-5 md:p-6 min-h-[380px] h-auto flex flex-col bg-surface border-border/70 shadow-sm min-w-0 w-full">
          <div className="flex items-start justify-between gap-3 mb-5 min-w-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-500 shrink-0">
                <Map className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-foreground tracking-tight truncate">Top Distances Today</h3>
                <p className="text-xs text-muted-foreground truncate">Technicians with highest verified travel</p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] shrink-0">Haversine Engine</Badge>
          </div>

          <div className="flex-1 w-full min-h-[260px] min-w-0">
            {workerDistanceTravelled?.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={workerDistanceTravelled} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border/40" vertical={false} />
                  <XAxis dataKey="workerName" stroke="currentColor" className="text-muted-foreground text-[11px]" tickFormatter={(val) => val.split(' ')[0]} tickMargin={8} axisLine={false} tickLine={false} />
                  <YAxis stroke="currentColor" className="text-muted-foreground text-[11px]" tickFormatter={(val) => `${val}km`} tickMargin={8} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'currentColor', className: 'text-muted/10' }} />
                  <Bar dataKey="distance" name="Distance (km)" fill="#d946ef" radius={[4, 4, 0, 0]} animationDuration={800} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-6">
                <EmptyState
                  icon={Map}
                  title="No Route Telemetry"
                  description="Technician travel distances will appear once movement starts."
                  className="py-4"
                />
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* 4. Distance Trend */}
      <motion.div variants={itemVariants} className="min-w-0 flex flex-col">
        <Card className="p-5 md:p-6 min-h-[380px] h-auto flex flex-col bg-surface border-border/70 shadow-sm min-w-0 w-full">
          <div className="flex items-start justify-between gap-3 mb-5 min-w-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-success/10 flex items-center justify-center text-success shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-foreground tracking-tight truncate">Organization Travel Trend</h3>
                <p className="text-xs text-muted-foreground truncate">Cumulative daily travel over 7 days</p>
              </div>
            </div>
            <Badge variant="success" className="text-[10px] shrink-0">7-Day Trajectory</Badge>
          </div>

          <div className="flex-1 w-full min-h-[260px] min-w-0">
            {distanceTrend?.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={distanceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorDistance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border/40" vertical={false} />
                  <XAxis dataKey="date" stroke="currentColor" className="text-muted-foreground text-[11px]" tickFormatter={(val) => val.split('-').slice(1).join('/')} tickMargin={8} axisLine={false} tickLine={false} />
                  <YAxis stroke="currentColor" className="text-muted-foreground text-[11px]" tickFormatter={(val) => `${val}km`} tickMargin={8} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'currentColor', strokeWidth: 1, strokeDasharray: '3 3', className: 'text-border' }} />
                  <Area type="monotone" dataKey="distance" name="Total Distance (km)" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorDistance)" animationDuration={800} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-6">
                <EmptyState
                  icon={TrendingUp}
                  title="No Historical Distance"
                  description="7-day travel history will aggregate here."
                  className="py-4"
                />
              </div>
            )}
          </div>
        </Card>
      </motion.div>

    </motion.div>
  );
}
