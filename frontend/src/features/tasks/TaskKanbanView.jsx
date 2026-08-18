import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  User, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  PlayCircle, 
  ShieldCheck, 
  Inbox, 
  Edit2, 
  Eye, 
  Trash2, 
  MoreVertical,
  ArrowRight,
  GripVertical
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../app/api';
import { Card } from '../../common/components/ui/Card';
import { Badge } from '../../common/components/ui/Badge';
import { Avatar } from '../../common/components/ui/Avatar';
import { Button } from '../../common/components/ui/Button';
import { Input } from '../../common/components/ui/Input';
import { Select } from '../../common/components/ui/Select';
import { Skeleton } from '../../common/components/ui/Skeleton';
import { EmptyState } from '../../common/components/ui/EmptyState';
import { AlertDialog } from '../../common/components/ui/AlertDialog';

const KANBAN_COLUMNS = [
  {
    id: 'unassigned',
    title: 'Unassigned',
    icon: Inbox,
    colorScheme: 'default',
    badgeVariant: 'outline',
    headerBg: 'bg-muted/40 text-muted-foreground border-border/70',
    dropHighlight: 'border-muted-foreground/40 bg-muted/10',
    description: 'Awaiting technician assignment'
  },
  {
    id: 'assigned',
    title: 'Assigned',
    icon: Clock,
    colorScheme: 'warning',
    badgeVariant: 'warning',
    headerBg: 'bg-warning/10 text-warning border-warning/20',
    dropHighlight: 'border-warning/50 bg-warning/5',
    description: 'Dispatched to technician'
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    icon: PlayCircle,
    colorScheme: 'info',
    badgeVariant: 'info',
    headerBg: 'bg-info/10 text-info border-info/20',
    dropHighlight: 'border-info/50 bg-info/5',
    description: 'Field work currently active'
  },
  {
    id: 'completed',
    title: 'Completed',
    icon: CheckCircle2,
    colorScheme: 'success',
    badgeVariant: 'success',
    headerBg: 'bg-success/10 text-success border-success/20',
    dropHighlight: 'border-success/50 bg-success/5',
    description: 'Submitted proof of work'
  },
  {
    id: 'verified',
    title: 'Verified',
    icon: ShieldCheck,
    colorScheme: 'primary',
    badgeVariant: 'primary',
    headerBg: 'bg-primary/10 text-primary border-primary/20',
    dropHighlight: 'border-primary/50 bg-primary/5',
    description: 'Admin verified and closed'
  }
];

function getPriorityBadge(priority) {
  switch (priority?.toLowerCase()) {
    case 'urgent':
      return <Badge variant="destructive" className="text-[10px] uppercase font-bold px-1.5 py-0">Urgent</Badge>;
    case 'high':
      return <Badge variant="warning" className="text-[10px] uppercase font-bold px-1.5 py-0">High</Badge>;
    case 'medium':
      return <Badge variant="info" className="text-[10px] uppercase font-bold px-1.5 py-0">Medium</Badge>;
    case 'low':
      return <Badge variant="outline" className="text-[10px] uppercase font-bold px-1.5 py-0">Low</Badge>;
    default:
      return <Badge variant="outline" className="text-[10px] uppercase font-bold px-1.5 py-0">{priority || 'Normal'}</Badge>;
  }
}

function formatDeadline(value) {
  if (!value) return 'No deadline';
  const d = new Date(value);
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function TaskKanbanView({
  tasks = [],
  loading = false,
  selectedTaskId,
  onSelectTask,
  onEditTask,
  onDeleted,
  onReviewTask,
  onTaskUpdated
}) {
  const [localTasks, setLocalTasks] = useState(tasks);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [activeDragId, setActiveDragId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [alertConfig, setAlertConfig] = useState({ isOpen: false });

  // Synchronize local tasks with incoming props
  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  // Filter tasks client-side for rapid responsiveness
  const filteredTasks = useMemo(() => {
    return localTasks.filter(task => {
      if (priorityFilter && task.priority !== priorityFilter) return false;
      if (search) {
        const query = search.toLowerCase();
        const titleMatch = task.title?.toLowerCase().includes(query);
        const locationMatch = task.locationAddress?.toLowerCase().includes(query);
        const workerMatch = task.assignedTo?.name?.toLowerCase().includes(query);
        if (!titleMatch && !locationMatch && !workerMatch) return false;
      }
      return true;
    });
  }, [localTasks, priorityFilter, search]);

  // Group tasks by status column
  const columnsData = useMemo(() => {
    const map = {
      unassigned: [],
      assigned: [],
      'in-progress': [],
      completed: [],
      verified: []
    };

    filteredTasks.forEach(t => {
      let statusKey = t.status || 'unassigned';
      if (statusKey === 'in_progress') statusKey = 'in-progress';
      if (map[statusKey]) {
        map[statusKey].push(t);
      } else {
        map.unassigned.push(t);
      }
    });

    return map;
  }, [filteredTasks]);

  // Handle Drag Start
  const handleDragStart = (e, task) => {
    setActiveDragId(task._id);
    e.dataTransfer.setData('text/plain', task._id);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle Drag Over column
  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  // Handle Drop onto Column
  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = activeDragId || e.dataTransfer.getData('text/plain');
    setActiveDragId(null);

    if (!taskId) return;

    const taskToMove = localTasks.find(t => t._id === taskId);
    if (!taskToMove) return;

    const currentNormalizedStatus = taskToMove.status === 'in_progress' ? 'in-progress' : taskToMove.status;
    if (currentNormalizedStatus === targetStatus) {
      return; // Already in target column
    }

    // Optimistic UI Update
    const previousTasks = [...localTasks];
    setLocalTasks(prev => prev.map(t => {
      if (t._id === taskId) {
        return {
          ...t,
          status: targetStatus,
          assignedTo: targetStatus === 'unassigned' ? null : t.assignedTo
        };
      }
      return t;
    }));

    try {
      const payload = { status: targetStatus };
      if (targetStatus === 'unassigned') {
        payload.assignedTo = null;
      }

      await api.put(`/tasks/${taskId}`, payload);
      toast.success(`Task moved to "${KANBAN_COLUMNS.find(c => c.id === targetStatus)?.title}"`);
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      console.error('Failed to update task status:', err);
      toast.error(err.response?.data?.message || 'Failed to update task status.');
      setLocalTasks(previousTasks);
    }
  };

  // Direct move via dropdown for touch/accessibility
  const handleDirectStatusChange = async (task, newStatus) => {
    if (task.status === newStatus) return;

    const previousTasks = [...localTasks];
    setLocalTasks(prev => prev.map(t => (t._id === task._id ? { ...t, status: newStatus } : t)));

    try {
      const payload = { status: newStatus };
      if (newStatus === 'unassigned') payload.assignedTo = null;

      await api.put(`/tasks/${task._id}`, payload);
      toast.success(`Task updated to ${newStatus}`);
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update task status.');
      setLocalTasks(previousTasks);
    }
  };

  const handleDeleteTask = (task) => {
    setAlertConfig({
      isOpen: true,
      title: 'Delete Work Order',
      description: `Are you sure you want to permanently delete "${task.title}"? This action cannot be undone.`,
      confirmLabel: 'Delete Task',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          await api.delete(`/tasks/${task._id}`);
          toast.success('Task deleted successfully');
          setLocalTasks(prev => prev.filter(t => t._id !== task._id));
          if (onDeleted) onDeleted();
        } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to delete task.');
        } finally {
          setAlertConfig({ isOpen: false });
        }
      }
    });
  };

  return (
    <div className="space-y-4 min-w-0 w-full flex flex-col flex-1">
      {/* Kanban Filter & Control Bar */}
      <Card className="p-3.5 bg-surface border-border/70 shadow-sm min-w-0">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 min-w-0">
          
          <div className="relative flex-1 w-full min-w-0">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Filter board tasks by title, location, or worker..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs w-full bg-background"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
            <Select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              options={[
                { value: '', label: 'All Priorities' },
                { value: 'urgent', label: 'Urgent Priority' },
                { value: 'high', label: 'High Priority' },
                { value: 'medium', label: 'Medium Priority' },
                { value: 'low', label: 'Low Priority' }
              ]}
              className="h-9 text-xs w-full sm:w-44 bg-background"
            />

            {(search || priorityFilter) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSearch(''); setPriorityFilter(''); }}
                className="text-xs text-muted-foreground hover:text-foreground h-9 px-2.5 shrink-0"
              >
                Reset Filters
              </Button>
            )}
          </div>

        </div>
      </Card>

      {/* Kanban Board Multi-Column Workspace */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4.5 items-start min-w-0 w-full pb-6 overflow-x-auto">
        {KANBAN_COLUMNS.map((column) => {
          const columnTasks = columnsData[column.id] || [];
          const Icon = column.icon;
          const isOver = dragOverColumn === column.id;

          return (
            <div
              key={column.id}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={() => setDragOverColumn(null)}
              onDrop={(e) => handleDrop(e, column.id)}
              className={`flex flex-col rounded-2xl border transition-all duration-200 min-w-[280px] sm:min-w-0 bg-surface/70 ${
                isOver ? column.dropHighlight + ' ring-2 ring-primary/40 shadow-md' : 'border-border/70 shadow-sm'
              }`}
            >
              {/* Column Header */}
              <div className={`p-3.5 rounded-t-2xl border-b flex items-center justify-between gap-2 ${column.headerBg}`}>
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="font-bold text-xs uppercase tracking-wider truncate">
                    {column.title}
                  </span>
                </div>
                <Badge variant={column.badgeVariant} className="text-[11px] font-extrabold px-2 py-0.5 rounded-full shrink-0">
                  {columnTasks.length}
                </Badge>
              </div>

              {/* Task Cards List inside Column */}
              <div className="p-3 space-y-3 min-h-[420px] max-h-[calc(100vh-340px)] overflow-y-auto custom-scrollbar flex flex-col">
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2].map(i => (
                      <Skeleton key={i} className="h-28 rounded-xl w-full" />
                    ))}
                  </div>
                ) : columnTasks.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-10 px-4 text-center border border-dashed border-border/60 rounded-xl bg-surface-muted/20">
                    <Icon className="w-6 h-6 text-muted-foreground/40 mb-2" />
                    <p className="text-xs font-semibold text-muted-foreground">No {column.title.toLowerCase()} tasks</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-0.5">{column.description}</p>
                  </div>
                ) : (
                  columnTasks.map((task) => {
                    const isSelected = selectedTaskId === task._id;
                    const isUrgent = task.priority === 'urgent' || task.priority === 'high';

                    return (
                      <div
                        key={task._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task)}
                        onClick={() => onSelectTask && onSelectTask(task)}
                        className={`group p-3.5 rounded-xl border transition-all duration-200 bg-surface cursor-grab active:cursor-grabbing hover:shadow-md relative ${
                          isSelected 
                            ? 'border-primary ring-2 ring-primary/40 shadow-sm' 
                            : 'border-border/70 hover:border-border'
                        } ${isUrgent ? 'border-l-4 border-l-destructive' : ''}`}
                      >
                        {/* Drag Handle & Priority Badge */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5">
                            <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
                            {getPriorityBadge(task.priority)}
                          </div>

                          {/* Quick Action Buttons */}
                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            {onReviewTask && (task.status === 'completed' || task.status === 'verified') && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onReviewTask(task); }}
                                className="p-1 hover:bg-success/10 hover:text-success rounded text-muted-foreground transition-colors"
                                title="Review Submission Proof"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {onEditTask && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onEditTask(task); }}
                                className="p-1 hover:bg-primary/10 hover:text-primary rounded text-muted-foreground transition-colors"
                                title="Edit Work Order"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleDeleteTask(task); }}
                              className="p-1 hover:bg-destructive/10 hover:text-destructive rounded text-muted-foreground transition-colors"
                              title="Delete Work Order"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Task Title */}
                        <h4 className="font-bold text-xs text-foreground leading-snug break-words mb-2 group-hover:text-primary transition-colors">
                          {task.title}
                        </h4>

                        {/* Location Address */}
                        {task.locationAddress && (
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-2">
                            <MapPin className="w-3 h-3 text-primary shrink-0" />
                            <span className="truncate">{task.locationAddress}</span>
                          </div>
                        )}

                        {/* Assignee & Deadline Footer */}
                        <div className="pt-2 border-t border-border/50 flex items-center justify-between gap-2 mt-2">
                          {/* Assignee Avatar / Name */}
                          <div className="flex items-center gap-1.5 min-w-0">
                            {task.assignedTo ? (
                              <>
                                <Avatar 
                                  fallback={task.assignedTo.name || '?'} 
                                  size="xs" 
                                  className="shrink-0"
                                />
                                <span className="text-[11px] font-semibold text-foreground truncate">
                                  {task.assignedTo.name}
                                </span>
                              </>
                            ) : (
                              <span className="text-[10px] font-medium text-muted-foreground italic">
                                Unassigned
                              </span>
                            )}
                          </div>

                          {/* Due Date */}
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0 font-medium">
                            <Calendar className="w-3 h-3 text-muted-foreground/70" />
                            <span>{formatDeadline(task.deadline)}</span>
                          </div>
                        </div>

                        {/* Quick Direct Move Menu for touch devices */}
                        <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between text-[10px]">
                          <span className="text-muted-foreground font-medium">Move status:</span>
                          <select
                            value={task.status || 'unassigned'}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleDirectStatusChange(task, e.target.value);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[10px] bg-surface-muted border border-border/60 rounded px-1.5 py-0.5 text-foreground font-semibold focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                          >
                            <option value="unassigned">Unassigned</option>
                            <option value="assigned">Assigned</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="verified">Verified</option>
                          </select>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      <AlertDialog
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig({ isOpen: false })}
        title={alertConfig.title}
        description={alertConfig.description}
        confirmLabel={alertConfig.confirmLabel}
        variant={alertConfig.variant}
        onConfirm={alertConfig.onConfirm}
      />
    </div>
  );
}
