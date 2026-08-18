import React, { useState, useEffect } from 'react';
import AttendanceLog from '../../features/attendance/AttendanceLog';
import ShiftManager from '../../features/attendance/ShiftManager';
import api from '../../app/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Card } from '../../common/components/ui/Card';
import { Input } from '../../common/components/ui/Input';
import { UserCheck, UserX, Clock, CalendarClock, Briefcase } from 'lucide-react';

import { PageHeader } from '../../common/components/ui/PageHeader';
import { StatCard } from '../../common/components/ui/StatCard';

export default function AttendanceDashboard() {
  const [activeTab, setActiveTab] = useState('log'); // 'log' or 'shifts'
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchRecords = async (date) => {
    setLoading(true);
    try {
      const res = await api.get(`/attendance?date=${date}`);
      setRecords(res.data.data);
    } catch (error) {
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'log') {
      fetchRecords(filterDate);
    }
  }, [filterDate, activeTab]);

  const presentCount = records.filter(r => r.status === 'present' || r.status === 'half-day' || r.status === 'on-leave').length;
  const lateCount = records.filter(r => r.status === 'late').length;
  const absentCount = records.filter(r => r.status === 'absent').length;
  
  const checkedInCount = records.filter(r => r.checkIn?.time && !r.checkOut?.time).length;
  const completedCount = records.filter(r => r.checkOut?.time).length;
  const notCheckedInYetCount = records.filter(r => !r.checkIn?.time && r.status !== 'absent' && r.status !== 'on-leave').length;

  return (
    <div className="flex flex-col gap-6 min-h-[calc(100vh-80px)] max-w-[1600px] mx-auto pb-10">
      
      <PageHeader
        title="Attendance Management"
        description="Monitor workforce attendance, manage shifts, and track performance."
        icon={CalendarClock}
        variant="prominent"
        actions={
          <div className="flex bg-surface-muted/50 p-1.5 rounded-xl border border-border/50 shadow-inner">
            <button
              onClick={() => setActiveTab('log')}
              className={`relative px-5 py-2.5 rounded-lg text-sm font-bold transition-colors ${activeTab === 'log' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {activeTab === 'log' && (
                <motion.div layoutId="attendance-tab" className="absolute inset-0 bg-background rounded-lg shadow-sm border border-border/50" />
              )}
              <span className="relative z-10 flex items-center gap-2"><UserCheck className="w-4 h-4" /> Daily Log</span>
            </button>
            <button
              onClick={() => setActiveTab('shifts')}
              className={`relative px-5 py-2.5 rounded-lg text-sm font-bold transition-colors ${activeTab === 'shifts' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {activeTab === 'shifts' && (
                <motion.div layoutId="attendance-tab" className="absolute inset-0 bg-background rounded-lg shadow-sm border border-border/50" />
              )}
              <span className="relative z-10 flex items-center gap-2"><Briefcase className="w-4 h-4" /> Shifts</span>
            </button>
          </div>
        }
      />

      {activeTab === 'log' && (
        <div className="space-y-6 flex-1 flex flex-col">
          
          {/* Statistics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4 min-w-0 w-full">
            <StatCard title="Present" value={presentCount} colorScheme="success" className="shadow-sm border-border/70" />
            <StatCard title="Late" value={lateCount} colorScheme="warning" className="shadow-sm border-border/70" />
            <StatCard title="Absent" value={absentCount} colorScheme="danger" className="shadow-sm border-border/70" />
            <StatCard title="Checked In" value={checkedInCount} colorScheme="info" className="shadow-sm border-border/70" />
            <StatCard title="Completed Shift" value={completedCount} colorScheme="default" className="shadow-sm border-border/70" />
            <StatCard title="Not Checked In" value={notCheckedInYetCount} colorScheme="default" className="shadow-sm border-border/70" />
          </div>

          <Card className="flex-1 flex flex-col overflow-hidden border-border/50 shadow-sm">
            <div className="p-4 border-b border-border/50 bg-surface-muted/30 sticky top-0 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-foreground">Daily Log Details</h2>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Input 
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full sm:w-48 h-10"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-x-auto">
              <AttendanceLog records={records} loading={loading} />
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'shifts' && (
        <ShiftManager />
      )}
    </div>
  );
}
