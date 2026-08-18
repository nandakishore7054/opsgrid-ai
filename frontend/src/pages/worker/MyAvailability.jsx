import React, { useState } from 'react';
import AvailabilityGrid from '../../features/availability/AvailabilityGrid';
import LeaveRequestForm from '../../features/availability/LeaveRequestForm';
import LeaveRequestList from '../../features/availability/LeaveRequestList';
import { PageHeader } from '../../common/components/ui/PageHeader';
import { CalendarDays, Clock, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MyAvailability() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleLeaveSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="max-w-7xl mx-auto space-y-6 pb-12 w-full"
    >
      {/* Modernized Page Header */}
      <PageHeader
        title="My Availability & Time Off"
        description="Configure your recurring weekly work schedule and submit time-off requests for manager review."
        icon={CalendarDays}
      />

      {/* Responsive 2-Column Operations Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Weekly Availability Grid (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <AvailabilityGrid workerId="me" />
        </div>

        {/* Right Column: Time-Off Request Form & Request History (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <LeaveRequestForm onSuccess={handleLeaveSuccess} />
          <LeaveRequestList refreshTrigger={refreshTrigger} isAdmin={false} />
        </div>

      </div>
    </motion.div>
  );
}
