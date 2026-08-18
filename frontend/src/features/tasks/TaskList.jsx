import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Edit2, Eye, Trash2, Calendar, MapPin, ListTodo, Inbox 
} from 'lucide-react';
import api from '../../app/api';
import { Card } from '../../common/components/ui/Card';
import { Badge } from '../../common/components/ui/Badge';
import { Skeleton } from '../../common/components/ui/Skeleton';
import { EmptyState } from '../../common/components/ui/EmptyState';
import { DataTable } from '../../common/components/ui/DataTable';
import { AlertDialog } from '../../common/components/ui/AlertDialog';
import { Avatar } from '../../common/components/ui/Avatar';
import { Select } from '../../common/components/ui/Select';

function formatDate(value) {
  if (!value) return 'No deadline';
  return new Date(value).toLocaleString([], { 
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
  });
}

function getPriorityVariant(priority) {
  switch (priority?.toLowerCase()) {
    case 'urgent': return 'error';
    case 'high': return 'warning';
    case 'medium': return 'info';
    case 'low': return 'default';
    default: return 'default';
  }
}

function getStatusVariant(status) {
  switch (status?.toLowerCase()) {
    case 'verified': return 'success';
    case 'completed': return 'success';
    case 'in-progress': return 'info';
    case 'assigned': return 'warning';
    case 'unassigned': return 'error';
    default: return 'default';
  }
}

function LoadingRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <tr key={index} className="border-b border-border/50">
          <td className="px-4 py-4"><Skeleton className="h-5 w-3/4 mb-2" /><Skeleton className="h-4 w-1/2" /></td>
          <td className="px-4 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
          <td className="px-4 py-4"><Skeleton className="h-5 w-32" /></td>
          <td className="px-4 py-4"><Skeleton className="h-6 w-24 rounded-full" /></td>
          <td className="px-4 py-4"><Skeleton className="h-5 w-28" /></td>
          <td className="px-4 py-4"><Skeleton className="h-8 w-24" /></td>
        </tr>
      ))}
    </>
  );
}

export default function TaskList({ 
  tasks: propTasks, 
  loading: propLoading, 
  refreshToken, 
  selectedTaskId, 
  onSelectTask, 
  onEditTask, 
  onDeleted, 
  onReviewTask 
}) {
  const [internalTasks, setInternalTasks] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [search, setSearch] = useState('');
  const [internalLoading, setInternalLoading] = useState(true);
  const [serverMessage, setServerMessage] = useState('');
  const [alertConfig, setAlertConfig] = useState({ isOpen: false });

  const isControlled = Array.isArray(propTasks);
  const loading = propLoading !== undefined ? propLoading : internalLoading;

  async function loadTasks(nextPage = pagination.page, nextStatus = statusFilter, nextPriority = priorityFilter, nextSearch = search) {
    if (isControlled) return;
    setInternalLoading(true);
    setServerMessage('');

    try {
      const response = await api.get('/tasks', {
        params: {
          page: nextPage,
          limit: pagination.limit,
          status: nextStatus || undefined,
          priority: nextPriority || undefined,
          search: nextSearch || undefined,
        },
      });

      const payload = response.data?.data || {};
      setInternalTasks(payload.tasks || []);
      setPagination({
        ...payload.pagination,
        limit: payload.pagination?.limit || pagination.limit,
      });
    } catch (error) {
      setServerMessage(error.response?.data?.message || 'Unable to load tasks.');
    } finally {
      setInternalLoading(false);
    }
  }

  useEffect(() => {
    if (!isControlled) {
      loadTasks(1, statusFilter, priorityFilter, search);
    }
  }, [refreshToken, statusFilter, priorityFilter, search, isControlled]);

  const displayedTasks = useMemo(() => {
    if (!isControlled) return internalTasks;
    return propTasks.filter(task => {
      if (statusFilter && (task.status !== statusFilter && (statusFilter !== 'in-progress' || task.status !== 'in_progress'))) {
        return false;
      }
      if (priorityFilter && task.priority !== priorityFilter) {
        return false;
      }
      if (search) {
        const query = search.toLowerCase();
        const titleMatch = task.title?.toLowerCase().includes(query);
        const locationMatch = task.locationAddress?.toLowerCase().includes(query);
        const workerMatch = task.assignedTo?.name?.toLowerCase().includes(query);
        if (!titleMatch && !locationMatch && !workerMatch) return false;
      }
      return true;
    });
  }, [isControlled, propTasks, internalTasks, statusFilter, priorityFilter, search]);

  function handleDelete(taskId) {
    setAlertConfig({
      isOpen: true,
      title: 'Delete Task',
      description: 'Are you sure you want to delete this task?',
      intent: 'danger',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        setAlertConfig({ isOpen: false });
        try {
          await api.delete(`/tasks/${taskId}`);
          onDeleted?.();
          if (!isControlled) {
            await loadTasks(pagination.page, statusFilter);
          }
        } catch (error) {
          setServerMessage(error.response?.data?.message || 'Unable to delete the task.');
        }
      }
    });
  }

  return (
    <Card className="flex flex-col h-full bg-surface/50 border-border/50 shadow-sm overflow-hidden min-w-0 w-full">
      {/* Header & Filters */}
      <div className="p-5 sm:p-6 border-b border-border/50 bg-surface min-w-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 min-w-0">
          <div>
            <h3 className="text-xl font-bold text-foreground">Task Directory</h3>
            <p className="text-sm text-muted-foreground mt-1">Manage and track all organizational tasks.</p>
          </div>
          <div className="flex items-center gap-2 bg-muted/20 px-3 py-1.5 rounded-full border border-border shrink-0">
             <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
             <span className="text-xs font-semibold text-muted-foreground">Live Data</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 min-w-0">
          <div className="relative min-w-0">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <Search className="w-4 h-4 text-muted-foreground" />
            </div>
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
            />
          </div>
          
          <div className="relative min-w-0">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              icon={Filter}
              options={[
                { value: '', label: 'All Statuses' },
                ...['unassigned', 'assigned', 'in-progress', 'completed', 'verified'].map(s => ({
                  value: s,
                  label: s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')
                }))
              ]}
              className="w-full"
            />
          </div>

          <div className="relative min-w-0">
            <Select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              icon={Filter}
              options={[
                { value: '', label: 'All Priorities' },
                ...['low', 'medium', 'high', 'urgent'].map(p => ({
                  value: p,
                  label: p.charAt(0).toUpperCase() + p.slice(1)
                }))
              ]}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {serverMessage && (
        <div className="p-4 bg-destructive/10 border-b border-destructive/20 text-destructive text-sm font-medium">
          {serverMessage}
        </div>
      )}

      {/* Table Content */}
      <div className="flex-1 overflow-x-auto min-w-0">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b border-border/50 bg-muted/20 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <th className="px-5 py-3.5">Title & Location</th>
              <th className="px-4 py-3.5">Priority</th>
              <th className="px-4 py-3.5">Assigned To</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5">Deadline</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 text-sm">
            {loading ? (
              <LoadingRows />
            ) : displayedTasks.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-12">
                  <EmptyState 
                    icon={Inbox}
                    title="No Tasks Found"
                    description="There are no tasks matching your current filter criteria."
                  />
                </td>
              </tr>
            ) : (
              displayedTasks.map((task) => {
                const isSelected = selectedTaskId === task._id;
                return (
                  <tr 
                    key={task._id}
                    onClick={() => onSelectTask?.(task)}
                    className={`cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-primary/10 hover:bg-primary/15' 
                        : 'hover:bg-muted/30'
                    }`}
                  >
                    <td className="px-5 py-4">
                      <div className="font-semibold text-foreground">{task.title}</div>
                      {task.locationAddress && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate max-w-xs">
                          <MapPin className="w-3 h-3 shrink-0 text-primary" />
                          <span className="truncate">{task.locationAddress}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={getPriorityVariant(task.priority)} className="capitalize text-xs">
                        {task.priority}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      {task.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <Avatar fallback={task.assignedTo.name || '?'} size="sm" />
                          <span className="text-foreground text-xs font-medium">{task.assignedTo.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={getStatusVariant(task.status)} className="capitalize text-xs">
                        {task.status.replace('-', ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(task.deadline)}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onEditTask?.(task)}
                          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
                          title="Edit Task"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onReviewTask?.(task)}
                          className="p-1.5 text-muted-foreground hover:text-success hover:bg-success/10 rounded-lg transition-colors"
                          title="Review Submissions"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(task._id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          title="Delete Task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination (Only for uncontrolled mode) */}
      {!isControlled && pagination.totalPages > 1 && (
        <div className="p-4 border-t border-border/50 bg-surface flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => loadTasks(pagination.page - 1)}
              className="px-3 py-1.5 rounded-lg border border-border bg-background disabled:opacity-50 hover:bg-muted/30"
            >
              Previous
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => loadTasks(pagination.page + 1)}
              className="px-3 py-1.5 rounded-lg border border-border bg-background disabled:opacity-50 hover:bg-muted/30"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog 
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig({ isOpen: false })}
        title={alertConfig.title}
        description={alertConfig.description}
        intent={alertConfig.intent}
        confirmLabel={alertConfig.confirmLabel}
        onConfirm={alertConfig.onConfirm}
      />
    </Card>
  );
}