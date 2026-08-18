import React from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from '../../common/components/ui/Skeleton';
import { Badge } from '../../common/components/ui/Badge';
import { EmptyState } from '../../common/components/ui/EmptyState';
import { DataTable } from '../../common/components/ui/DataTable';
import { Avatar } from '../../common/components/ui/Avatar';
import { FileX, ShieldCheck, MapPin, Clock, Briefcase, Calendar, CalendarOff } from 'lucide-react';

function timeAgoFormat(dateInput) {
  const date = new Date(dateInput);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatTime(dateString) {
  if (!dateString) return '--:--';
  return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function AttendanceTimeline({ record }) {
  const steps = [];
  
  // Shift Start
  steps.push({
    label: 'Shift Start',
    time: record.shiftId?.startTime ? record.shiftId.startTime : null,
    active: true,
    isFirst: true
  });
  
  // Check In
  steps.push({
    label: 'Check In',
    time: record.checkIn?.time ? formatTime(record.checkIn.time) : null,
    active: !!record.checkIn?.time,
    isFirst: false
  });
  
  // Check Out
  steps.push({
    label: 'Check Out',
    time: record.checkOut?.time ? formatTime(record.checkOut.time) : null,
    active: !!record.checkOut?.time,
    isFirst: false,
    isLast: true
  });

  return (
    <div className="flex items-center w-full mt-4 bg-muted/20 rounded-xl p-4 border border-border/30">
      {steps.map((step, idx) => (
        <React.Fragment key={idx}>
          <div className="flex flex-col items-center relative z-10 shrink-0">
            <div className={`w-3 h-3 rounded-full border-2 ${step.active ? 'bg-primary border-primary' : 'bg-background border-muted-foreground/40'} ${!step.time && step.active ? 'bg-background border-primary' : ''}`} />
            <span className={`text-[10px] font-bold mt-2 uppercase tracking-wider ${step.active ? 'text-foreground' : 'text-muted-foreground'}`}>{step.label}</span>
            {step.time && (
              <span className="text-[10px] text-muted-foreground font-mono mt-0.5">{step.time}</span>
            )}
          </div>
          {!step.isLast && (
            <div className={`flex-1 h-0.5 mx-2 ${steps[idx+1]?.active ? 'bg-primary/50' : 'bg-border'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function AttendanceLog({ records, loading }) {
  if (loading) {
    return (
      <div className="p-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex flex-col p-5 border border-border/50 rounded-2xl bg-surface">
            <div className="flex items-start gap-4">
              <Skeleton className="w-12 h-12 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            </div>
            <Skeleton className="h-20 w-full mt-6 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="p-12 h-full flex items-center justify-center">
        <EmptyState
          icon={CalendarOff}
          title="No attendance records"
          description="There are no attendance records for the selected date."
        />
      </div>
    );
  }

  const pendingRecords = records.filter(r => !r.checkIn?.time && r.status !== 'absent' && r.status !== 'on-leave');
  const activeRecords = records.filter(r => r.checkIn?.time || r.status === 'absent' || r.status === 'on-leave');

  const commonColumns = [
    {
      key: 'worker',
      label: 'Worker',
      render: (record) => (
        <div className="flex items-center gap-3">
          <Avatar fallback={record.workerId?.name || 'U'} size="sm" className="shadow-sm" />
          <div className="flex flex-col">
            <span className="font-bold text-foreground leading-tight">{record.workerId?.name || 'Unknown'}</span>
            <span className="text-[10px] text-muted-foreground">{record.workerId?.role || 'Worker'}</span>
          </div>
        </div>
      )
    },
    {
      key: 'shift',
      label: 'Shift',
      render: (record) => (
        <div className="flex flex-col">
          <span className="font-semibold text-foreground">{record.shiftId?.name || 'Not Scheduled'}</span>
          <span className="text-xs text-muted-foreground">{new Date(record.date).toLocaleDateString()}</span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (record) => (
        <Badge 
          variant={
            record.status === 'present' ? 'success' :
            record.status === 'late' ? 'warning' :
            record.status === 'absent' ? 'destructive' : 'info'
          } 
          className="uppercase text-[10px] px-2 py-0.5"
        >
          {record.status}
        </Badge>
      )
    }
  ];

  return (
    <div className="p-4 md:p-6 space-y-8 bg-muted/5 h-full overflow-y-auto custom-scrollbar flex flex-col">
      
      {pendingRecords.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-warning" />
              Not Checked In Yet
            </h3>
            <Badge variant="warning" className="px-2">{pendingRecords.length}</Badge>
          </div>
          <DataTable 
            data={pendingRecords}
            loading={false}
            pagination={true}
            pageSize={5}
            columns={commonColumns}
          />
        </section>
      )}

      {activeRecords.length > 0 && (
        <section className="flex-1 flex flex-col min-h-[300px]">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Active & Completed Shifts
            </h3>
            <Badge variant="default" className="px-2">{activeRecords.length}</Badge>
          </div>
          <DataTable 
            className="flex-1"
            data={activeRecords}
            loading={false}
            searchable={true}
            pagination={true}
            pageSize={10}
            columns={[
              ...commonColumns,
              {
                key: 'workingHrs',
                label: 'Working Hrs',
                render: (record) => (
                  <span className="font-mono font-bold text-primary">{record.totalHours ? `${record.totalHours}h` : '0h'}</span>
                )
              },
              {
                key: 'location',
                label: 'Location',
                render: (record) => record.checkIn?.location?.coordinates ? (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    <span>{record.checkIn.location.coordinates[1].toFixed(4)}, {record.checkIn.location.coordinates[0].toFixed(4)}</span>
                  </div>
                ) : <span className="text-muted-foreground">-</span>
              },
              {
                key: 'timeline',
                label: 'Timeline',
                sortable: false,
                render: (record) => (
                  <div className="min-w-[300px]">
                    <AttendanceTimeline record={record} />
                  </div>
                )
              }
            ]}
          />
        </section>
      )}
    </div>
  );
}
