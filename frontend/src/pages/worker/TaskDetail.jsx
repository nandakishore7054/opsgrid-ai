import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, FileX, Briefcase } from 'lucide-react';
import api from '../../app/api';
import WorkerTaskDetail from '../../features/tasks/WorkerTaskDetail';
import { Card } from '../../common/components/ui/Card';
import { Skeleton } from '../../common/components/ui/Skeleton';
import { EmptyState } from '../../common/components/ui/EmptyState';
import { Button } from '../../common/components/ui/Button';

export default function TaskDetail() {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadTask() {
      setLoading(true);
      setError('');

      try {
        const response = await api.get('/tasks/my-tasks');
        const tasks = response.data?.data?.tasks || [];
        const foundTask = tasks.find((item) => item._id === id);

        if (isMounted) {
          if (!foundTask) {
            setError('Task not found.');
          } else {
            setTask(foundTask);
          }
        }
      } catch (requestError) {
        if (isMounted) {
          setError(requestError.response?.data?.message || 'Unable to load the task.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadTask();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-12 w-full">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-36 rounded-md" />
            <Skeleton className="h-8 w-64 rounded-md" />
          </div>
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>

        {/* Stepper Skeleton */}
        <Skeleton className="h-20 w-full rounded-2xl" />

        {/* 2-Column Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
          <div className="lg:col-span-5 space-y-6">
            <Skeleton className="h-80 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-12 w-full">
        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
          <Link to="/worker/dashboard" className="hover:text-primary transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Task Queue
          </Link>
        </div>

        <Card className="p-10 border-border/70 bg-surface shadow-sm text-center">
          <EmptyState
            icon={error === 'Task not found.' || !task ? FileX : AlertTriangle}
            title={error === 'Task not found.' || !task ? 'Task Not Found' : 'Unable to Load Task'}
            description={
              error || 'The requested work order could not be found or may have been unassigned.'
            }
            action={
              <Button as={Link} to="/worker/dashboard" className="mt-4 gap-2 text-xs font-bold shadow-sm">
                <Briefcase className="w-4 h-4" />
                <span>Return to Tasks Dashboard</span>
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  return <WorkerTaskDetail task={task} onStatusUpdated={setTask} />;
}