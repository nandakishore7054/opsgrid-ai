import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, ChevronRight, Briefcase, CheckCircle2, Clock } from 'lucide-react';
import { Card } from '../../common/components/ui/Card';
import { Badge } from '../../common/components/ui/Badge';
import { Skeleton } from '../../common/components/ui/Skeleton';
import { EmptyState } from '../../common/components/ui/EmptyState';

function formatDate(value) {
  if (!value) return 'No deadline set';
  return new Date(value).toLocaleString(undefined, {
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit'
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
    case 'verified':
    case 'completed': 
      return 'success';
    case 'in-progress':
    case 'in_progress': 
      return 'info';
    case 'assigned': 
      return 'warning';
    case 'rejected': 
      return 'destructive';
    default: 
      return 'outline';
  }
}

export default function WorkerTaskList({ tasks = [], loading = false, error = null, activeTab = 'today', onTabChange }) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="p-5 h-52 bg-surface/70 border-border/70">
            <div className="flex justify-between items-start mb-4">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full mb-4" />
            <div className="mt-auto pt-3 border-t border-border/50 flex justify-between items-center">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-20" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-xs font-semibold text-destructive">
        {error}
      </div>
    );
  }

  if (!tasks.length) {
    const emptyConfig = {
      today: {
        icon: Briefcase,
        title: "No Tasks For Today",
        description: "You're all caught up! No active tasks are assigned for today's shift.",
        actionText: onTabChange ? "View Upcoming Tasks →" : null,
        onAction: onTabChange ? () => onTabChange('upcoming') : null
      },
      upcoming: {
        icon: Clock,
        title: "No Upcoming Tasks",
        description: "Future tasks will appear here once scheduled and dispatched by the team.",
        actionText: null,
        onAction: null
      },
      completed: {
        icon: CheckCircle2,
        title: "No Completed Tasks Yet",
        description: "Tasks you complete during your shift will be logged here.",
        actionText: onTabChange ? "View Today's Tasks →" : null,
        onAction: onTabChange ? () => onTabChange('today') : null
      }
    }[activeTab] || {
      icon: Briefcase,
      title: "No Tasks Available",
      description: "No tasks found matching the current filter.",
      actionText: null,
      onAction: null
    };

    return (
      <Card className="p-8 border-border/70 bg-surface shadow-sm text-center">
        <EmptyState 
          icon={emptyConfig.icon} 
          title={emptyConfig.title} 
          description={emptyConfig.description}
          action={emptyConfig.actionText && emptyConfig.onAction ? (
            <button
              onClick={emptyConfig.onAction}
              className="text-xs font-bold text-primary hover:underline mt-2"
            >
              {emptyConfig.actionText}
            </button>
          ) : null}
        />
      </Card>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.04 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25 } }
  };

  return (
    <motion.div 
      variants={container} 
      initial="hidden" 
      animate="show" 
      className="grid gap-4.5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 min-w-0 w-full"
    >
      {tasks.map((task) => (
        <motion.div variants={item} key={task._id} className="min-w-0 flex">
          <Card 
            as={Link}
            to={`/worker/tasks/${task._id}`}
            variant="interactive"
            className="flex flex-col h-full w-full p-5 bg-surface border-border/70 hover:border-primary/50 shadow-sm group min-w-0"
          >
            {/* Header: Priority & Status Badges */}
            <div className="flex items-start justify-between gap-2 mb-3 min-w-0">
              <Badge variant={getPriorityVariant(task.priority)} className="text-[10px] px-2 py-0 uppercase tracking-wider font-bold shrink-0">
                {task.priority || 'Normal'}
              </Badge>
              <Badge variant={getStatusVariant(task.status)} className="text-[10px] capitalize shrink-0 font-semibold">
                {(task.status || 'pending').replace('_', ' ').replace('-', ' ')}
              </Badge>
            </div>

            {/* Title & Description */}
            <h3 className="text-sm font-bold text-foreground leading-snug group-hover:text-primary transition-colors mb-2 break-words">
              {task.title}
            </h3>

            {task.description && (
              <p className="text-xs text-muted-foreground mb-4 break-words leading-relaxed whitespace-normal">
                {task.description}
              </p>
            )}

            {/* Location and Deadline Information */}
            <div className="space-y-1.5 text-xs text-muted-foreground bg-surface-muted/40 p-2.5 rounded-xl mb-4 mt-auto border border-border/50">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-primary" />
                <span className="truncate">
                  {task.locationAddress || task.location?.address || 'Location on map'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 shrink-0 text-primary" />
                <span className="truncate">{formatDate(task.deadline)}</span>
              </div>
            </div>

            {/* Footer Action Link */}
            <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs font-bold text-primary">
              <span>View Task Details</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}