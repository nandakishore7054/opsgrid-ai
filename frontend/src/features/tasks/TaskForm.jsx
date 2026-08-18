import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Type, AlignLeft, Flag, Clock, MapPin, User, AlertCircle 
} from 'lucide-react';
import api from '../../app/api';
import { Card } from '../../common/components/ui/Card';
import { Input } from '../../common/components/ui/Input';
import { Button } from '../../common/components/ui/Button';
import { Select } from '../../common/components/ui/Select';

const initialFormState = {
  title: '',
  description: '',
  priority: 'medium',
  deadline: '',
  locationAddress: '',
  assignedTo: '',
};

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

function validateTaskForm(formState) {
  const errors = {};

  if (!formState.title.trim()) {
    errors.title = 'Title is required.';
  }

  if (!formState.deadline) {
    errors.deadline = 'Deadline is required.';
  } else if (new Date(formState.deadline).getTime() <= Date.now()) {
    errors.deadline = 'Deadline must be in the future.';
  }

  return errors;
}

export default function TaskForm({ editingTask, onSaved, onCancel }) {
  const [formState, setFormState] = useState(initialFormState);
  const [workers, setWorkers] = useState([]);
  const [loadingWorkers, setLoadingWorkers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverMessage, setServerMessage] = useState('');
  const [workerAvailabilityStatus, setWorkerAvailabilityStatus] = useState(null);

  const isEditing = Boolean(editingTask);

  useEffect(() => {
    if (editingTask) {
      setFormState({
        title: editingTask.title || '',
        description: editingTask.description || '',
        priority: editingTask.priority || 'medium',
        deadline: editingTask.deadline ? new Date(editingTask.deadline).toISOString().slice(0, 16) : '',
        locationAddress: editingTask.locationAddress || '',
        assignedTo: editingTask.assignedTo?._id || editingTask.assignedTo || '',
      });
      return;
    }

    setFormState(initialFormState);
  }, [editingTask]);

  useEffect(() => {
    let isMounted = true;

    async function loadWorkers() {
      try {
        const response = await api.get('/users/workers');
        const workerList = response.data?.data?.workers || [];

        if (isMounted) {
          setWorkers(workerList);
        }
      } catch (error) {
        if (isMounted) {
          setServerMessage(error.response?.data?.message || 'Unable to load workers.');
        }
      } finally {
        if (isMounted) {
          setLoadingWorkers(false);
        }
      }
    }

    loadWorkers();

    return () => {
      isMounted = false;
    };
  }, []);

  const workerOptions = useMemo(
    () => [
      { value: '', label: 'Unassigned' },
      ...workers.map((w) => ({ value: w._id, label: `${w.name} (${w.email})` }))
    ],
    [workers]
  );

  useEffect(() => {
    async function checkAvailability() {
      if (!formState.assignedTo || !formState.deadline) {
        setWorkerAvailabilityStatus(null);
        return;
      }
      try {
        const res = await api.get(`/availability/${formState.assignedTo}`);
        const availabilities = res.data?.data || [];
        
        const date = new Date(formState.deadline);
        const dayOfWeek = date.getDay();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const timeStr = `${hours}:${minutes}`;

        const dayAvail = availabilities.find(a => a.dayOfWeek === dayOfWeek);
        
        if (!dayAvail || timeStr < dayAvail.startTime || timeStr > dayAvail.endTime) {
          setWorkerAvailabilityStatus('Worker is unavailable during this time.');
        } else {
          setWorkerAvailabilityStatus(null);
        }
      } catch (e) {
        console.error('Failed to fetch worker availability', e);
      }
    }
    
    checkAvailability();
  }, [formState.assignedTo, formState.deadline]);

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateTaskForm(formState);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);
    setServerMessage('');

    const payload = {
      title: formState.title.trim(),
      description: formState.description.trim(),
      priority: formState.priority,
      deadline: new Date(formState.deadline).toISOString(),
      locationAddress: formState.locationAddress.trim(),
      assignedTo: formState.assignedTo || null,
    };

    try {
      if (isEditing) {
        await api.put(`/tasks/${editingTask._id}`, payload);
      } else {
        await api.post('/tasks', payload);
      }

      setFormState(initialFormState);
      onSaved?.();
    } catch (error) {
      setServerMessage(error.response?.data?.message || 'Unable to save the task.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="p-5 sm:p-6 sticky top-24 shadow-sm bg-surface/50 border-border/50">
      <div className="mb-6 pb-4 border-b border-border/50">
        <h3 className="text-xl font-bold text-foreground">
          {isEditing ? 'Edit Task' : 'Create Task'}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {isEditing ? 'Update task details and assignment.' : 'Fill out the form below to dispatch a new task.'}
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        
        <div className="space-y-4">
          <Input
            label="Title"
            leftIcon={<Type className="w-4 h-4 text-muted-foreground" />}
            placeholder="Inspect north warehouse"
            value={formState.title}
            onChange={(e) => setFormState({ ...formState, title: e.target.value })}
            error={errors.title}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Description</label>
            <div className="relative">
              <div className="absolute left-3 top-3.5 pointer-events-none">
                <AlignLeft className="w-4 h-4 text-muted-foreground" />
              </div>
              <textarea
                rows={4}
                value={formState.description}
                onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-surface text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-shadow resize-none"
                placeholder="Provide any important instructions..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Priority</label>
              <Select
                value={formState.priority}
                onChange={(e) => setFormState({ ...formState, priority: e.target.value })}
                icon={Flag}
                options={priorityOptions}
              />
            </div>

            <Input
              type="datetime-local"
              label="Deadline"
              leftIcon={<Clock className="w-4 h-4 text-muted-foreground" />}
              value={formState.deadline}
              onChange={(e) => setFormState({ ...formState, deadline: e.target.value })}
              error={errors.deadline}
            />
          </div>

          <Input
            label="Location Address"
            leftIcon={<MapPin className="w-4 h-4 text-muted-foreground" />}
            placeholder="Warehouse 14, Industrial Park"
            value={formState.locationAddress}
            onChange={(e) => setFormState({ ...formState, locationAddress: e.target.value })}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Assignee</label>
            <div className="relative">
              <Select
                value={formState.assignedTo}
                onChange={(e) => setFormState({ ...formState, assignedTo: e.target.value })}
                disabled={loadingWorkers}
                icon={User}
                options={workerOptions}
              />
            </div>
            
            <AnimatePresence>
              {workerAvailabilityStatus && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-1.5 text-xs text-warning mt-1"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{workerAvailabilityStatus}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence>
          {serverMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20"
            >
              {serverMessage}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col sm:flex-row gap-3 pt-4 mt-6 border-t border-border/50">
          <Button
            type="submit"
            isLoading={submitting}
            className="w-full sm:flex-1"
          >
            {isEditing ? 'Update Task' : 'Create Task'}
          </Button>
          
          {isEditing && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="w-full sm:flex-1"
            >
              Cancel Edit
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}