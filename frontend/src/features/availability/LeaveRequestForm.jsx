import React, { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../app/api';
import { Card } from '../../common/components/ui/Card';
import { Button } from '../../common/components/ui/Button';
import { Input } from '../../common/components/ui/Input';
import { Select } from '../../common/components/ui/Select';
import { CalendarRange, Send, Calendar, Clock, FileText, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LeaveRequestForm({ onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formState, setFormState] = useState({
    type: 'vacation',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const handleChange = (e) => {
    setFormState({ ...formState, [e.target.name]: e.target.value });
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formState.startDate || !formState.endDate) {
      toast.error('Both Start Date and End Date are required.');
      return;
    }

    if (new Date(formState.startDate) > new Date(formState.endDate)) {
      toast.error('End Date cannot be earlier than Start Date.');
      return;
    }

    try {
      setLoading(true);
      await api.post('/leave-requests', formState);
      toast.success('Time-off request submitted successfully!');
      setFormState({ type: 'vacation', startDate: '', endDate: '', reason: '' });
      if (onSuccess) onSuccess();
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        error.response?.data?.error?.message ||
        error.response?.data?.error?.details?.startDate?.[0] ||
        'Failed to submit leave request. Please check for date conflicts.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 border-border/70 bg-surface shadow-sm space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2.5 pb-3 border-b border-border/60">
        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <CalendarRange className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">Request Time Off</h3>
          <p className="text-[11px] text-muted-foreground">Submit a leave request for supervisor review</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Leave Category Select */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground uppercase tracking-wider">
            Leave Category
          </label>
          <Select
            name="type"
            value={formState.type}
            onChange={handleChange}
            options={[
              { value: 'vacation', label: 'Vacation' },
              { value: 'sick', label: 'Sick Leave' },
              { value: 'personal', label: 'Personal Leave' },
              { value: 'emergency', label: 'Emergency Leave' },
            ]}
            className="w-full"
          />
        </div>

        {/* Date Range Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">
              Start Date
            </label>
            <Input
              type="date"
              name="startDate"
              value={formState.startDate}
              onChange={handleChange}
              min={todayStr}
              required
              className="bg-background text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">
              End Date
            </label>
            <Input
              type="date"
              name="endDate"
              value={formState.endDate}
              onChange={handleChange}
              min={formState.startDate || todayStr}
              required
              className="bg-background text-xs"
            />
          </div>
        </div>

        {/* Reason / Notes Textarea */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground uppercase tracking-wider">
            Reason or Handover Notes <span className="text-muted-foreground font-normal lowercase">(optional)</span>
          </label>
          <textarea
            name="reason"
            value={formState.reason}
            onChange={handleChange}
            rows={3}
            placeholder="Add handover notes or context for your dispatch manager..."
            className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-xs transition-all resize-none"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <Button
            type="submit"
            isLoading={loading}
            disabled={loading || !formState.startDate || !formState.endDate}
            className="w-full py-4 text-xs font-bold gap-2 shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Time-Off Request</span>
          </Button>
        </div>

      </form>
    </Card>
  );
}
