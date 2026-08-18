import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../../app/api';
import { socket } from '../../../app/socket';
import { useAuth } from '../../../app/auth-context';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  BellRing, 
  Briefcase, 
  Camera, 
  CheckCircle2, 
  AlertTriangle, 
  CalendarClock, 
  Clock, 
  ChevronRight 
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { EmptyState } from '../ui/EmptyState';
import { Badge } from '../ui/Badge';
import { TimeAgo } from '../ui/TimeAgo';
import { cn } from '../ui/utils';

export default function NotificationDropdown() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'unread'
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchNotifications() {
      try {
        const response = await api.get('/notifications');
        if (isMounted) {
          setNotifications(response.data?.data?.notifications || []);
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    }
    fetchNotifications();
    return () => {
      isMounted = false;
    };
  }, []);

  // Real-time WebSocket Listeners
  useEffect(() => {
    function handleTaskCreated(payload) {
      const notif = payload?.notification || {
        _id: `temp-${Date.now()}`,
        message: payload?.task?.title ? `New task assigned: ${payload.task.title}` : 'New task assigned to you.',
        type: 'task:created',
        relatedTaskId: payload?.task?._id,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      setNotifications((prev) => [notif, ...prev]);
      toast.success(notif.message);
    }

    function handleSubmissionCreated(payload) {
      const taskTitle = payload?.task?.title || 'a task';
      const newNotif = {
        _id: `temp-${Date.now()}`,
        message: `Worker has submitted proof for task: ${taskTitle}`,
        type: 'submission:created',
        relatedTaskId: payload?.task?._id,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      setNotifications((prev) => [newNotif, ...prev]);
      toast.success(newNotif.message);
    }

    function handleTaskVerified(payload) {
      const notif = payload?.notification || {
        _id: `temp-${Date.now()}`,
        message: payload?.task?.title ? `Task "${payload.task.title}" was verified.` : 'Task submission verified.',
        type: 'task:verified',
        relatedTaskId: payload?.task?._id,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      setNotifications((prev) => [notif, ...prev]);
      toast.success(notif.message);
    }

    function handleLeaveRequested(payload) {
      const workerName = payload?.worker?.name || 'A technician';
      const newNotif = {
        _id: `temp-${Date.now()}`,
        message: `New leave request from ${workerName}`,
        type: 'leave_request',
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      setNotifications((prev) => [newNotif, ...prev]);
      toast.success(newNotif.message);
    }

    function handleLeaveApproved(payload) {
      const status = payload?.leaveRequest?.status || 'approved';
      const type = status === 'approved' ? 'leave_approved' : 'leave_rejected';
      const message = `Your leave request has been ${status}`;
      const newNotif = {
        _id: `temp-${Date.now()}`,
        message,
        type,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      setNotifications((prev) => [newNotif, ...prev]);
      if (status === 'approved') {
        toast.success(message);
      } else {
        toast.error(message);
      }
    }

    socket.on('task:created', handleTaskCreated);
    socket.on('submission:created', handleSubmissionCreated);
    socket.on('task:verified', handleTaskVerified);
    socket.on('leave:requested', handleLeaveRequested);
    socket.on('leave:approved', handleLeaveApproved);

    return () => {
      socket.off('task:created', handleTaskCreated);
      socket.off('submission:created', handleSubmissionCreated);
      socket.off('task:verified', handleTaskVerified);
      socket.off('leave:requested', handleLeaveRequested);
      socket.off('leave:approved', handleLeaveApproved);
    };
  }, []);

  // Click outside and Escape handler
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    function handleEscape(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  async function markAsRead(id) {
    if (id.startsWith('temp-')) {
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
      return;
    }

    try {
      await api.patch(`/notifications/${id}/read`, { isRead: true });
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }

  async function markAllAsRead() {
    const unread = notifications.filter((n) => !n.isRead);
    if (!unread.length) return;

    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

    try {
      await Promise.all(
        unread.map((n) => {
          if (!n._id.startsWith('temp-')) {
            return api.patch(`/notifications/${n._id}/read`, { isRead: true });
          }
          return Promise.resolve();
        })
      );
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }

  function handleNotificationClick(notification) {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    setIsOpen(false);

    const userRole = user?.role;
    const { type, relatedTaskId } = notification;

    // Role-Aware Verified Navigation
    if (userRole === 'worker') {
      if ((type === 'task:created' || type === 'task:verified') && relatedTaskId) {
        navigate(`/worker/tasks/${relatedTaskId}`);
      } else if (type === 'leave_approved' || type === 'leave_rejected') {
        navigate('/worker/my-availability');
      }
    } else if (userRole === 'admin' || userRole === 'dispatcher') {
      if (type === 'submission:created') {
        navigate('/admin/dispatch-board');
      } else if (type === 'leave_request') {
        navigate('/admin/availability');
      } else if (type === 'attendance_late') {
        navigate('/admin/attendance');
      }
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const filteredNotifications =
    activeFilter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'task:created':
        return (
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Briefcase className="w-4 h-4" />
          </div>
        );
      case 'submission:created':
        return (
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <Camera className="w-4 h-4" />
          </div>
        );
      case 'task:verified':
      case 'leave_approved':
        return (
          <div className="w-8 h-8 rounded-lg bg-success/10 text-success flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        );
      case 'leave_rejected':
      case 'attendance_late':
        return (
          <div className="w-8 h-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
        );
      case 'leave_request':
        return (
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <CalendarClock className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-surface-muted text-muted-foreground flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        className={cn(
          "relative flex h-10 w-10 items-center justify-center rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-primary/40",
          isOpen
            ? "bg-surface-muted text-foreground"
            : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
        )}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-destructive ring-2 ring-background animate-pulse" />
        )}
      </button>

      {/* Flyout Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute right-0 mt-2.5 w-[360px] sm:w-[390px] max-w-[calc(100vw-1.5rem)] rounded-2xl border border-border/80 bg-surface shadow-xl z-50 overflow-hidden origin-top-right flex flex-col max-h-[34rem]"
          >
            {/* Header */}
            <div className="px-4 py-3.5 border-b border-border/70 bg-surface flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-foreground tracking-tight">Notifications</h3>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0 font-extrabold">
                    {unreadCount}
                  </Badge>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs font-bold text-primary hover:text-primary-hover transition-colors flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-primary/5"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="px-4 py-2 border-b border-border/60 bg-surface-muted/30 flex items-center gap-2">
              <button
                onClick={() => setActiveFilter('all')}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-bold transition-all",
                  activeFilter === 'all'
                    ? "bg-background text-foreground shadow-xs border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                All ({notifications.length})
              </button>

              <button
                onClick={() => setActiveFilter('unread')}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                  activeFilter === 'unread'
                    ? "bg-background text-foreground shadow-xs border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span>Unread</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] px-1 py-0 rounded-full bg-destructive/15 text-destructive font-extrabold">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* Notifications Feed */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {filteredNotifications.length === 0 ? (
                <EmptyState
                  icon={BellRing}
                  title={activeFilter === 'unread' ? "All Caught Up!" : "No Notifications"}
                  description={
                    activeFilter === 'unread'
                      ? "You have read all of your operational updates."
                      : "You have no activity notifications yet."
                  }
                  className="min-h-[220px] py-8"
                />
              ) : (
                <div className="divide-y divide-border/60">
                  {filteredNotifications.map((notification) => {
                    const isClickable =
                      (user?.role === 'worker' &&
                        ((notification.type === 'task:created' || notification.type === 'task:verified') &&
                          Boolean(notification.relatedTaskId)) ||
                        notification.type === 'leave_approved' ||
                        notification.type === 'leave_rejected') ||
                      ((user?.role === 'admin' || user?.role === 'dispatcher') &&
                        (notification.type === 'submission:created' ||
                          notification.type === 'leave_request' ||
                          notification.type === 'attendance_late'));

                    return (
                      <div
                        key={notification._id}
                        onClick={() => handleNotificationClick(notification)}
                        role={isClickable ? "button" : undefined}
                        tabIndex={isClickable ? 0 : undefined}
                        onKeyDown={(e) => {
                          if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                            e.preventDefault();
                            handleNotificationClick(notification);
                          }
                        }}
                        className={cn(
                          "p-3.5 transition-colors flex gap-3 items-start relative group",
                          isClickable && "cursor-pointer hover:bg-surface-muted/60",
                          !notification.isRead ? "bg-primary/5" : "bg-transparent opacity-75 hover:opacity-100"
                        )}
                      >
                        {getNotificationIcon(notification.type)}

                        <div className="flex-1 min-w-0 space-y-1">
                          <p
                            className={cn(
                              "text-xs leading-snug break-words",
                              !notification.isRead ? "font-bold text-foreground" : "font-normal text-muted-foreground"
                            )}
                          >
                            {notification.message}
                          </p>

                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
                            <TimeAgo date={notification.createdAt} />
                            {!notification.isRead && (
                              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                            )}
                          </div>
                        </div>

                        {isClickable && (
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-2" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
