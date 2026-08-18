import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../app/api';
import { Card } from '../../common/components/ui/Card';
import { Input } from '../../common/components/ui/Input';
import { Button } from '../../common/components/ui/Button';
import { Skeleton } from '../../common/components/ui/Skeleton';
import { motion } from 'framer-motion';
import { Pencil, Trash2, Clock, Users, ShieldAlert, Plus, Check } from 'lucide-react';
import { AlertDialog } from '../../common/components/ui/AlertDialog';
import { Select } from '../../common/components/ui/Select';

export default function ShiftManager() {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formState, setFormState] = useState({ name: '', startTime: '', endTime: '', gracePeriodMinutes: 15, workers: [] });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [activeWorkers, setActiveWorkers] = useState([]);
  const [alertConfig, setAlertConfig] = useState({ isOpen: false });

  const fetchShifts = async () => {
    try {
      const res = await api.get('/shifts');
      setShifts(res.data.data);
    } catch (error) {
      toast.error('Failed to load shifts');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkers = async () => {
    try {
      const res = await api.get('/users/workers');
      const workersData = res.data?.data?.workers || res.data?.data || [];
      if (Array.isArray(workersData)) {
        setActiveWorkers(workersData);
      } else {
        setActiveWorkers([]);
      }
    } catch (error) {
      toast.error('Failed to load workers');
      setActiveWorkers([]);
    }
  };

  useEffect(() => {
    fetchShifts();
    fetchWorkers();
  }, []);

  const handleChange = (e) => {
    const value = e.target.type === 'number' ? parseInt(e.target.value) : e.target.value;
    setFormState({ ...formState, [e.target.name]: value });
  };

  const handleWorkerChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
    setFormState({ ...formState, workers: selectedOptions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/shifts/${editingId}`, formState);
        toast.success('Shift updated successfully');
      } else {
        await api.post('/shifts', formState);
        toast.success('Shift created successfully');
      }
      setFormState({ name: '', startTime: '', endTime: '', gracePeriodMinutes: 15, workers: [] });
      setEditingId(null);
      fetchShifts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save shift');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (shift) => {
    setFormState({
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      gracePeriodMinutes: shift.gracePeriodMinutes,
      workers: shift.workers ? shift.workers.map(w => w._id || w) : []
    });
    setEditingId(shift._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id) => {
    setAlertConfig({
      isOpen: true,
      title: 'Delete Shift',
      description: 'Are you sure you want to delete this shift?',
      intent: 'danger',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        setAlertConfig({ isOpen: false });
        try {
          await api.delete(`/shifts/${id}`);
          toast.success('Shift deleted');
          fetchShifts();
        } catch (error) {
          toast.error('Failed to delete shift');
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[400px] w-full rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <Card className="p-6 sm:p-8 border-border/50 shadow-sm">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border/50">
          <div className="p-2 bg-primary/10 text-primary rounded-lg">
            {editingId ? <Pencil className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">
              {editingId ? 'Edit Shift Configuration' : 'Create New Shift'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Define working hours, grace periods, and assign workers to this schedule.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-semibold text-foreground">Shift Name</label>
            <Input
              type="text"
              name="name"
              required
              value={formState.name}
              onChange={handleChange}
              placeholder="e.g., Morning Shift, Night Crew"
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" /> Start Time (HH:mm)
            </label>
            <Input
              type="time"
              name="startTime"
              required
              value={formState.startTime}
              onChange={handleChange}
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" /> End Time (HH:mm)
            </label>
            <Input
              type="time"
              name="endTime"
              required
              value={formState.endTime}
              onChange={handleChange}
            />
          </div>
          
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-muted-foreground" /> Grace Period (minutes)
            </label>
            <Input
              type="number"
              name="gracePeriodMinutes"
              min="0"
              required
              value={formState.gracePeriodMinutes}
              onChange={handleChange}
            />
            <p className="text-xs text-muted-foreground mt-1">Workers arriving within this window are not marked as late.</p>
          </div>
          
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" /> Assign Workers
            </label>
            <div className="relative">
              <Select
                multiple
                name="workers"
                value={formState.workers}
                onChange={handleWorkerChange}
                className="!h-40 py-3"
                options={activeWorkers.map(worker => ({
                  value: worker._id,
                  label: `${worker.name} (${worker.email})`
                }))}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
              <span className="inline-block px-1.5 py-0.5 rounded bg-surface-muted text-[10px] font-mono border border-border">Ctrl</span> or <span className="inline-block px-1.5 py-0.5 rounded bg-surface-muted text-[10px] font-mono border border-border">Cmd</span> + click to select multiple workers.
            </p>
          </div>
          
          <div className="md:col-span-2 flex justify-end gap-3 pt-6 mt-2 border-t border-border/50">
            {editingId && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingId(null);
                  setFormState({ name: '', startTime: '', endTime: '', gracePeriodMinutes: 15, workers: [] });
                }}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gap-2 px-8"
            >
              {isSubmitting ? 'Saving...' : (editingId ? <><Check className="w-4 h-4" /> Update Shift</> : <><Plus className="w-4 h-4" /> Create Shift</>)}
            </Button>
          </div>
        </form>
      </Card>

      <div className="pt-4">
        <h3 className="text-xl font-bold text-foreground mb-6">Active Shifts</h3>
        {shifts.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-border/50 rounded-2xl bg-surface-muted/10">
            <p className="text-muted-foreground font-medium">No shifts defined yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {shifts.map((shift, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={shift._id}
              >
                <Card className="h-full border-border/50 shadow-sm hover:shadow-md transition-all group overflow-hidden relative flex flex-col">
                  {/* Status Indicator */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/50" />
                  
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="text-lg font-bold text-foreground pr-4 line-clamp-1">{shift.name}</h4>
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${shift.isActive !== false ? 'bg-success shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-muted-foreground'}`} />
                    </div>
                    
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-muted/40 border border-border/30">
                        <Clock className="w-4 h-4 text-primary shrink-0" />
                        <div>
                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">Time</p>
                          <p className="text-sm font-mono font-medium text-foreground">{shift.startTime} - {shift.endTime}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-surface-muted/40 border border-border/30 flex flex-col justify-center">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5 flex items-center gap-1.5"><ShieldAlert className="w-3 h-3" /> Grace</p>
                          <p className="text-sm font-semibold text-foreground">{shift.gracePeriodMinutes} <span className="text-xs text-muted-foreground font-normal">m</span></p>
                        </div>
                        <div className="p-3 rounded-lg bg-surface-muted/40 border border-border/30 flex flex-col justify-center">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5 flex items-center gap-1.5"><Users className="w-3 h-3" /> Staff</p>
                          <p className="text-sm font-semibold text-foreground">{shift.workers?.length || 0}</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-6 pt-4 border-t border-border/50">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="flex-1 gap-2"
                        onClick={() => handleEdit(shift)}
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="icon-sm"
                        onClick={() => handleDelete(shift._id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog 
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
        title={alertConfig.title}
        description={alertConfig.description}
        intent={alertConfig.intent}
        confirmLabel={alertConfig.confirmLabel}
        onConfirm={alertConfig.onConfirm}
      />
    </div>
  );
}
