import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../app/api';
import ProofSubmissionForm from '../submissions/ProofSubmissionForm';
import { Card } from '../../common/components/ui/Card';
import { Button } from '../../common/components/ui/Button';
import { Badge } from '../../common/components/ui/Badge';
import { 
  MapPin, 
  Clock, 
  FileText, 
  ArrowLeft, 
  Play, 
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  User,
  ShieldCheck,
  CalendarDays,
  Layers
} from 'lucide-react';
import { motion } from 'framer-motion';

function formatDate(value) {
  if (!value) return 'No deadline set';
  return new Date(value).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getPriorityVariant(priority) {
  switch (priority?.toLowerCase()) {
    case 'urgent': return 'destructive';
    case 'high': return 'warning';
    case 'medium': return 'info';
    case 'low': return 'outline';
    default: return 'outline';
  }
}

function getStatusVariant(status) {
  switch (status?.toLowerCase()) {
    case 'verified': return 'success';
    case 'completed': return 'info';
    case 'in-progress': return 'warning';
    case 'assigned': return 'outline';
    case 'rejected': return 'destructive';
    default: return 'outline';
  }
}

export default function WorkerTaskDetail({ task, onStatusUpdated }) {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function startTask() {
    setSubmitting(true);
    setMessage('');
    setError('');

    try {
      const response = await api.patch(`/tasks/${task._id}/status`, { status: 'in-progress' });
      onStatusUpdated?.(response.data?.data?.task || null);
      setMessage('Task started successfully. You can now execute the work and submit proof.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to start the task.');
    } finally {
      setSubmitting(false);
    }
  }

  const getGoogleMapsLink = () => {
    if (task.locationCoordinates && Array.isArray(task.locationCoordinates.coordinates)) {
      const [lng, lat] = task.locationCoordinates.coordinates;
      if (lat !== undefined && lng !== undefined) {
        return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      }
    }
    if (task.locationAddress && task.locationAddress.trim()) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.locationAddress)}`;
    }
    return null;
  };

  const mapLink = getGoogleMapsLink();

  // Authentic lifecycle steps mapping strictly to real backend states
  const lifecycleSteps = [
    { id: 'assigned', label: 'Assigned' },
    { id: 'in-progress', label: 'In Progress' },
    { id: 'completed', label: 'Submitted' },
    { 
      id: task.status === 'rejected' ? 'rejected' : 'verified', 
      label: task.status === 'rejected' ? 'Rejected' : 'Verified' 
    }
  ];

  const getStepStatus = (stepId, index) => {
    const statusOrder = ['assigned', 'in-progress', 'completed', 'verified'];
    if (task.status === 'rejected') {
      if (stepId === 'rejected') return 'rejected';
      if (index <= 2) return 'completed';
      return 'pending';
    }

    const currentIdx = statusOrder.indexOf(task.status);
    if (currentIdx > index) return 'completed';
    if (currentIdx === index) return 'active';
    return 'pending';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.25 }}
      className="max-w-7xl mx-auto space-y-6 pb-12 w-full"
    >
      {/* Top Breadcrumb & Navigation Bar */}
      <div className="flex items-center justify-between gap-4">
        <Link 
          to="/worker/dashboard" 
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to My Tasks</span>
        </Link>

        <div className="flex items-center gap-2">
          <Badge variant={getPriorityVariant(task.priority)} className="text-[10px] uppercase font-extrabold px-2.5 py-0.5">
            {task.priority || 'Normal'} Priority
          </Badge>
          <Badge variant={getStatusVariant(task.status)} className="text-[10px] uppercase font-extrabold px-2.5 py-0.5">
            {task.status?.replace('-', ' ')}
          </Badge>
        </div>
      </div>

      {/* Task Header Card */}
      <Card className="p-6 md:p-7 border-border/70 bg-surface shadow-sm">
        <div className="space-y-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-primary mb-1">Work Order Details</div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {task.title}
            </h1>
          </div>

          {/* Authentic 4-Step Lifecycle Stepper */}
          <div className="pt-2">
            <div className="bg-background border border-border/70 rounded-2xl p-4 sm:p-5 shadow-xs">
              <div className="grid grid-cols-4 gap-2">
                {lifecycleSteps.map((step, idx) => {
                  const state = getStepStatus(step.id, idx);
                  return (
                    <div key={step.id} className="flex flex-col items-center text-center space-y-1.5">
                      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        state === 'completed'
                          ? 'bg-success text-white shadow-xs'
                          : state === 'active'
                          ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-xs'
                          : state === 'rejected'
                          ? 'bg-destructive text-white shadow-xs'
                          : 'bg-surface-muted text-muted-foreground border border-border/80'
                      }`}>
                        {state === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : state === 'rejected' ? (
                          <AlertTriangle className="w-4 h-4" />
                        ) : (
                          <span>{idx + 1}</span>
                        )}
                      </div>
                      <span className={`text-[11px] sm:text-xs font-bold leading-tight ${
                        state === 'active'
                          ? 'text-primary'
                          : state === 'completed'
                          ? 'text-foreground'
                          : state === 'rejected'
                          ? 'text-destructive'
                          : 'text-muted-foreground'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 2-Column Responsive Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Work Order Instructions & Actions (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Instructions Card */}
          <Card className="p-6 border-border/70 bg-surface shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-border/60">
              <FileText className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Task Instructions & Scope</h3>
            </div>

            <div className="text-xs sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
              {task.description ? (
                task.description
              ) : (
                <span className="text-muted-foreground italic">No detailed description provided for this work order.</span>
              )}
            </div>
          </Card>

          {/* Schedule & Metadata Card */}
          <Card className="p-6 border-border/70 bg-surface shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-border/60">
              <CalendarDays className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Schedule & Dispatch Details</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-background rounded-xl border border-border/60 space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Deadline</span>
                <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>{formatDate(task.deadline)}</span>
                </p>
              </div>

              {task.createdBy?.name && (
                <div className="p-3 bg-background rounded-xl border border-border/60 space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Dispatched By</span>
                  <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate">{task.createdBy.name}</span>
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Start Task Primary Action */}
          {task.status === 'assigned' && (
            <Card className="p-6 border-primary/30 bg-surface shadow-sm space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">Ready to begin this task?</h3>
                <p className="text-xs text-muted-foreground">
                  Update task status to <strong>"In Progress"</strong> to start logging time and unlock proof of work upload.
                </p>
              </div>

              {error && (
                <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive font-semibold">
                  {error}
                </div>
              )}

              {message && (
                <div className="rounded-xl bg-success/10 border border-success/20 p-3 text-xs text-success font-semibold">
                  {message}
                </div>
              )}

              <Button
                onClick={startTask}
                disabled={submitting}
                className="w-full min-h-[44px] py-3.5 text-xs font-bold gap-2 shadow-sm touch-manipulation active:scale-[0.99]"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{submitting ? 'Starting Work Order...' : 'Start Task'}</span>
              </Button>
            </Card>
          )}

        </div>

        {/* Right Column: Location & Proof of Work Submission (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Site Location & Map Navigation Card */}
          <Card className="p-6 border-border/70 bg-surface shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Site Location</h3>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground leading-snug">
                {task.locationAddress || 'Site coordinates provided'}
              </p>

              {task.locationCoordinates?.coordinates && (
                <p className="text-[11px] text-muted-foreground font-mono">
                  Coordinates: {task.locationCoordinates.coordinates[1].toFixed(5)}, {task.locationCoordinates.coordinates[0].toFixed(5)}
                </p>
              )}
            </div>

            {mapLink ? (
              <div className="pt-2">
                <a
                  href={mapLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-bold transition-colors shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in Google Maps Navigation</span>
                </a>
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground italic">No navigation coordinates available for this task.</p>
            )}
          </Card>

          {/* Proof Submission Module */}
          <ProofSubmissionForm task={task} onSubmitted={onStatusUpdated} />

        </div>

      </div>
    </motion.div>
  );
}