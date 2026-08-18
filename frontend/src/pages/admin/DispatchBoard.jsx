import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../app/api';
import { socket } from '../../app/socket';
import TaskForm from '../../features/tasks/TaskForm';
import TaskList from '../../features/tasks/TaskList';
import TaskKanbanView from '../../features/tasks/TaskKanbanView';
import AdminVerificationView from '../../features/submissions/AdminVerificationView';

import { PageHeader } from '../../common/components/ui/PageHeader';
import { StatCard } from '../../common/components/ui/StatCard';
import { Card } from '../../common/components/ui/Card';
import { Button } from '../../common/components/ui/Button';
import { Badge } from '../../common/components/ui/Badge';
import { Avatar } from '../../common/components/ui/Avatar';
import { Select } from '../../common/components/ui/Select';
import { EmptyState } from '../../common/components/ui/EmptyState';
import { 
  Plus, 
  X, 
  ListTodo, 
  MapPin, 
  Target, 
  Calendar, 
  Clock, 
  Edit2, 
  Trash2, 
  Eye, 
  LayoutGrid, 
  List 
} from 'lucide-react';

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

export default function DispatchBoard() {
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'
  const [refreshToken, setRefreshToken] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [tasksError, setTasksError] = useState('');
  
  const [editingTask, setEditingTask] = useState(null);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [selectedReviewTask, setSelectedReviewTask] = useState(null);
  const [loadingReview, setLoadingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  
  // Selected task drawer state
  const [selectedTask, setSelectedTask] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Quick stats state
  const [stats, setStats] = useState({
    total: 0,
    assigned: 0,
    unassigned: 0,
    highPriority: 0,
    completedToday: 0
  });

  // Real-time socket listeners
  useEffect(() => {
    function handleSubmissionCreated() {
      setRefreshToken((value) => value + 1);
    }
    function handleTaskCreated() {
      setRefreshToken((value) => value + 1);
    }

    socket.on('submission:created', handleSubmissionCreated);
    socket.on('task:created', handleTaskCreated);

    return () => {
      socket.off('submission:created', handleSubmissionCreated);
      socket.off('task:created', handleTaskCreated);
    };
  }, []);

  // Fetch technician list
  useEffect(() => {
    api.get('/users/workers').then(res => setWorkers(res.data?.data?.workers || [])).catch(() => {});
  }, []);

  // Single Source of Truth: Fetch tasks once for both Kanban and List views
  useEffect(() => {
    async function fetchTasks() {
      setLoadingTasks(true);
      setTasksError('');
      try {
        const response = await api.get('/tasks', { params: { limit: 100 } });
        const allTasks = response.data?.data?.tasks || [];
        setTasks(allTasks);

        const today = new Date().toDateString();
        let total = response.data?.data?.pagination?.total ?? allTasks.length;
        let assigned = 0;
        let unassigned = 0;
        let highPriority = 0;
        let completedToday = 0;

        allTasks.forEach(task => {
          if (task.status === 'unassigned') unassigned++;
          else assigned++;

          if (task.priority === 'high' || task.priority === 'urgent') highPriority++;

          if (task.status === 'completed' || task.status === 'verified') {
             if (new Date(task.updatedAt).toDateString() === today) completedToday++;
          }
        });

        setStats({ total, assigned, unassigned, highPriority, completedToday });
      } catch (err) {
        console.error('Failed to load dispatch board tasks:', err);
        setTasksError(err.response?.data?.message || 'Unable to load tasks.');
      } finally {
        setLoadingTasks(false);
      }
    }

    fetchTasks();
  }, [refreshToken]);

  useEffect(() => {
    if (selectedTask) {
      setSelectedAssignee(selectedTask.assignedTo?._id || selectedTask.assignedTo || '');
    }
  }, [selectedTask]);

  function handleSaved() {
    setEditingTask(null);
    setIsTaskFormOpen(false);
    setRefreshToken((value) => value + 1);
    if (selectedTask) {
      api.get(`/tasks/${selectedTask._id}`).then(res => {
        setSelectedTask(res.data?.data?.task || null);
      }).catch(() => setSelectedTask(null));
    }
  }

  function handleEditTask(task) {
    setEditingTask(task);
    setIsTaskFormOpen(true);
  }

  function handleCancelEdit() {
    setEditingTask(null);
    setIsTaskFormOpen(false);
  }
  
  function handleCreateTask() {
    setEditingTask(null);
    setIsTaskFormOpen(true);
  }

  async function handleReviewTask(task) {
    setLoadingReview(true);
    setReviewError('');
    try {
      const response = await api.get(`/tasks/${task._id}`);
      setSelectedReviewTask(response.data?.data?.task || null);
    } catch (error) {
      setReviewError(error.response?.data?.message || 'Unable to load verification details.');
    } finally {
      setLoadingReview(false);
    }
  }

  async function handleDeleteTask(taskId) {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await api.delete(`/tasks/${taskId}`);
        if (selectedTask?._id === taskId) {
          setSelectedTask(null);
        }
        handleSaved();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete task');
      }
    }
  }

  async function handleAssignTask() {
    if (!selectedTask) return;
    setAssigning(true);
    try {
      await api.put(`/tasks/${selectedTask._id}`, {
        assignedTo: selectedAssignee || null,
        status: selectedAssignee ? 'assigned' : 'unassigned'
      });
      handleSaved();
    } catch (err) {
      alert('Failed to assign task');
    } finally {
      setAssigning(false);
    }
  }

  return (
    <motion.section 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 p-2 md:p-6 min-w-0 w-full"
    >
      {/* Top Header with Action Buttons and View Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 min-w-0">
        <PageHeader
          title="Dispatch Board"
          description="Plan assignments, monitor field execution, and triage work orders in real-time."
        />

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* View Mode Toggle: Kanban vs List */}
          <div className="flex items-center p-1 bg-surface-muted/60 border border-border/70 rounded-xl shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'kanban'
                  ? 'bg-background text-foreground shadow-xs border border-border/60'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'list'
                  ? 'bg-background text-foreground shadow-xs border border-border/60'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>

          <Button onClick={handleCreateTask} className="gap-2 shadow-md hover:shadow-lg transition-all shrink-0">
            <Plus className="w-4 h-4" /> New Task
          </Button>
        </div>
      </div>

      {/* KPI Overview Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4 min-w-0 w-full">
        <StatCard title="Total Tasks" value={stats.total} variant="default" className="shadow-sm border-border/70" />
        <StatCard title="Assigned" value={stats.assigned} colorScheme="info" variant="default" className="shadow-sm border-border/70" />
        <StatCard title="Unassigned" value={stats.unassigned} colorScheme="warning" variant="default" className="shadow-sm border-border/70" />
        <StatCard title="High Priority" value={stats.highPriority} colorScheme="danger" variant="default" className="shadow-sm border-border/70" />
        <StatCard title="Completed Today" value={stats.completedToday} colorScheme="success" variant="default" className="shadow-sm border-border/70" />
      </div>

      {tasksError && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-xs font-semibold">
          {tasksError}
        </div>
      )}

      {/* Main Workspace: Kanban or List View */}
      {viewMode === 'kanban' ? (
        <div className="flex flex-col xl:flex-row gap-6 items-start min-w-0 w-full">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 min-w-0 w-full"
          >
            <TaskKanbanView
              tasks={tasks}
              loading={loadingTasks}
              selectedTaskId={selectedTask?._id}
              onSelectTask={setSelectedTask}
              onEditTask={handleEditTask}
              onDeleted={handleSaved}
              onReviewTask={handleReviewTask}
              onTaskUpdated={handleSaved}
            />
          </motion.div>

          {/* Optional Task Drawer when a card is selected */}
          {selectedTask && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full xl:w-[400px] 2xl:w-[440px] shrink-0 min-w-0"
            >
              <Card className="flex flex-col bg-surface border-border/70 shadow-sm overflow-hidden sticky top-24">
                <div className="p-4 border-b border-border/60 bg-surface-muted/30 flex justify-between items-start shrink-0">
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge variant={getPriorityVariant(selectedTask.priority)} className="capitalize px-2 py-0.5 text-[10px]">
                        {selectedTask.priority}
                      </Badge>
                      <Badge variant={getStatusVariant(selectedTask.status)} className="capitalize px-2 py-0.5 text-[10px]">
                        {selectedTask.status.replace('-', ' ')}
                      </Badge>
                    </div>
                    <h3 className="font-bold text-base text-foreground leading-snug break-words" title={selectedTask.title}>
                      {selectedTask.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => handleEditTask(selectedTask)} className="p-1.5 text-muted-foreground hover:bg-muted/50 rounded-lg transition-colors" title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleReviewTask(selectedTask)} className="p-1.5 text-muted-foreground hover:text-success hover:bg-success/10 rounded-lg transition-colors" title="Review">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteTask(selectedTask._id)} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setSelectedTask(null)} className="p-1.5 text-muted-foreground hover:bg-muted/50 rounded-lg transition-colors ml-1" title="Close">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-4 space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar">
                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Technician Assignment</h4>
                    <div className="flex flex-col gap-3 p-3.5 rounded-xl border border-border/60 bg-background shadow-xs">
                      <div className="flex items-center gap-3">
                        <Avatar fallback={selectedTask.assignedTo?.name || '?'} size="md" />
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-foreground truncate">{selectedTask.assignedTo?.name || 'Unassigned'}</div>
                          <div className="text-[11px] text-muted-foreground truncate">{selectedTask.assignedTo?.role || 'No worker assigned'}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                        <div className="flex-1">
                          <Select 
                            value={selectedAssignee}
                            onChange={(e) => setSelectedAssignee(e.target.value)}
                            options={[
                              { value: '', label: 'Unassigned' },
                              ...workers.map(w => ({ value: w._id, label: w.name }))
                            ]}
                            className="h-8 text-xs bg-surface"
                          />
                        </div>
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          disabled={assigning}
                          onClick={handleAssignTask}
                          className="h-8 text-xs font-semibold px-3 shrink-0"
                        >
                          {assigning ? 'Saving...' : 'Update'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {selectedTask.description && (
                    <div>
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Description</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed bg-background p-3 rounded-xl border border-border/60 break-words">
                        {selectedTask.description}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Operational Meta</h4>
                    <div className="p-3 bg-background rounded-xl border border-border/60 space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="font-medium">Due:</span>
                        <span className="text-foreground">{formatDate(selectedTask.deadline)}</span>
                      </div>
                      {selectedTask.locationAddress && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="font-medium">Site:</span>
                          <span className="text-foreground truncate">{selectedTask.locationAddress}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {(selectedTask.status === 'completed' || selectedTask.status === 'verified') && (
                    <Button 
                      className="w-full gap-2 shadow-sm font-semibold text-xs mt-2" 
                      variant="outline"
                      onClick={() => handleReviewTask(selectedTask)}
                    >
                      <Eye className="w-4 h-4 text-success" /> Review Proof of Work
                    </Button>
                  )}
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      ) : (
        <div className="flex flex-col xl:flex-row gap-6 min-h-[600px] min-w-0 w-full">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex-1 flex flex-col h-full min-w-0 w-full"
          >
            <TaskList 
              tasks={tasks}
              loading={loadingTasks}
              refreshToken={refreshToken} 
              selectedTaskId={selectedTask?._id}
              onSelectTask={setSelectedTask}
              onEditTask={handleEditTask} 
              onDeleted={handleSaved} 
              onReviewTask={handleReviewTask} 
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="w-full xl:w-[420px] 2xl:w-[460px] flex flex-col h-full shrink-0 min-w-0"
          >
            {selectedTask ? (
              <Card className="flex flex-col h-full bg-surface border-border/70 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-border/60 bg-surface-muted/30 flex justify-between items-start shrink-0">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={getPriorityVariant(selectedTask.priority)} className="capitalize px-2 py-0.5">{selectedTask.priority}</Badge>
                      <Badge variant={getStatusVariant(selectedTask.status)} className="capitalize px-2 py-0.5">{selectedTask.status.replace('-', ' ')}</Badge>
                    </div>
                    <h3 className="font-bold text-lg text-foreground leading-tight truncate" title={selectedTask.title}>{selectedTask.title}</h3>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => handleEditTask(selectedTask)} className="p-2 text-muted-foreground hover:bg-muted/50 rounded-lg transition-colors" title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleReviewTask(selectedTask)} className="p-2 text-muted-foreground hover:text-success hover:bg-success/10 rounded-lg transition-colors" title="Review">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteTask(selectedTask._id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setSelectedTask(null)} className="p-2 text-muted-foreground hover:bg-muted/50 rounded-lg transition-colors ml-1" title="Close">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-5 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Assignment</h4>
                    <div className="flex flex-col gap-3 p-4 rounded-xl border border-border/60 bg-background shadow-xs">
                      <div className="flex items-center gap-3">
                        <Avatar fallback={selectedTask.assignedTo?.name || '?'} size="lg" />
                        <div>
                          <div className="font-bold text-sm text-foreground">{selectedTask.assignedTo?.name || 'Unassigned'}</div>
                          <div className="text-xs text-muted-foreground">{selectedTask.assignedTo?.role || 'No worker assigned'}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 pt-3 border-t border-border/50 mt-1">
                        <div className="flex-1">
                          <Select 
                            value={selectedAssignee}
                            onChange={(e) => setSelectedAssignee(e.target.value)}
                            options={[
                              { value: '', label: 'Unassigned' },
                              ...workers.map(w => ({ value: w._id, label: w.name }))
                            ]}
                            className="h-9 text-xs"
                          />
                        </div>
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          disabled={assigning}
                          onClick={handleAssignTask}
                          className="h-9 font-semibold"
                        >
                          {assigning ? 'Saving...' : 'Update'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {selectedTask.description && (
                    <div>
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Description</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed bg-background p-4 rounded-xl border border-border/60 break-words">
                        {selectedTask.description}
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Schedule & Details</h4>
                    <div className="grid grid-cols-1 gap-2.5">
                      <div className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-background">
                        <Calendar className="w-4 h-4 text-primary shrink-0" />
                        <div>
                          <div className="text-xs text-muted-foreground">Deadline</div>
                          <div className="text-sm font-semibold text-foreground">{formatDate(selectedTask.deadline)}</div>
                        </div>
                      </div>

                      {selectedTask.locationAddress && (
                        <div className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-background">
                          <MapPin className="w-4 h-4 text-primary shrink-0" />
                          <div className="min-w-0">
                            <div className="text-xs text-muted-foreground">Location</div>
                            <div className="text-sm font-semibold text-foreground truncate">{selectedTask.locationAddress}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {(selectedTask.status === 'completed' || selectedTask.status === 'verified') && (
                    <Button 
                      className="w-full gap-2 shadow-sm font-semibold mt-4" 
                      variant="outline"
                      onClick={() => handleReviewTask(selectedTask)}
                    >
                      <Eye className="w-4 h-4 text-success" /> Review Verification Proof
                    </Button>
                  )}
                </div>
              </Card>
            ) : (
              <Card className="flex flex-col h-full bg-surface border-border/70 border-dashed items-center justify-center p-8 text-center">
                <EmptyState
                  icon={ListTodo}
                  title="No Task Selected"
                  description="Select a work order from the table to view assignment details and execute operational overrides."
                />
              </Card>
            )}
          </motion.div>
        </div>
      )}

      {/* Task Creation & Editing Drawer */}
      <AnimatePresence>
        {isTaskFormOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/60 backdrop-blur-xs transition-opacity" 
              onClick={handleCancelEdit} 
            />
            
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-lg bg-surface border-l border-border/70 shadow-2xl p-6 overflow-y-auto flex flex-col z-10 custom-scrollbar"
            >
              <div className="flex items-center justify-between pb-4 border-b border-border/60 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    {editingTask ? 'Edit Work Order' : 'Create New Work Order'}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {editingTask ? 'Update dispatch parameters and assignees' : 'Fill in task details to schedule a new work order'}
                  </p>
                </div>
                <button onClick={handleCancelEdit} className="p-2 text-muted-foreground hover:bg-muted/50 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1">
                <TaskForm 
                  task={editingTask} 
                  onSaved={handleSaved} 
                  onCancel={handleCancelEdit} 
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Proof of Work Verification Modal */}
      <AnimatePresence>
        {selectedReviewTask && (
          <AdminVerificationView
            task={selectedReviewTask}
            isOpen={Boolean(selectedReviewTask)}
            onClose={() => setSelectedReviewTask(null)}
            onVerified={() => {
              setSelectedReviewTask(null);
              handleSaved();
            }}
          />
        )}
      </AnimatePresence>
    </motion.section>
  );
}