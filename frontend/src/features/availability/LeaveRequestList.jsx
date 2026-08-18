import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../app/api';
import { Card } from '../../common/components/ui/Card';
import { Badge } from '../../common/components/ui/Badge';
import { Button } from '../../common/components/ui/Button';
import { Skeleton } from '../../common/components/ui/Skeleton';
import { EmptyState } from '../../common/components/ui/EmptyState';
import { DataTable } from '../../common/components/ui/DataTable';
import { Avatar } from '../../common/components/ui/Avatar';
import { CalendarOff, CheckCircle2, XCircle, Calendar, Clock, FileText, Check, X } from 'lucide-react';

export default function LeaveRequestList({ isAdmin = false, refreshTrigger = 0, onStatusUpdated }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, [isAdmin, refreshTrigger]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const endpoint = isAdmin ? '/leave-requests' : '/leave-requests/me';
      const res = await api.get(endpoint);
      const data = res.data?.data || [];
      
      // Sort to prioritize pending requests, then by creation date descending
      const sorted = [...data].sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (b.status === 'pending' && a.status !== 'pending') return 1;
        return new Date(b.createdAt || b.startDate) - new Date(a.createdAt || a.startDate);
      });
      setRequests(sorted);
    } catch (error) {
      toast.error('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id, status) => {
    try {
      setActionId(id);
      await api.patch(`/leave-requests/${id}/approve`, { status });
      toast.success(`Leave request ${status}`);
      fetchRequests();
      if (onStatusUpdated) onStatusUpdated();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to update request');
    } finally {
      setActionId(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return <Badge variant="success" className="text-[11px]"><CheckCircle2 className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="text-[11px]"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      case 'pending':
      default:
        return <Badge variant="warning" className="text-[11px]"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  if (loading && requests.length === 0) {
    return (
      <Card className="p-6 border-border/70 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card className="p-6 border-border/70 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <span>{isAdmin ? 'Team Leave Requests' : 'My Leave Requests'}</span>
          </h3>
        </div>
        <EmptyState
          icon={CalendarOff}
          title="No Leave Requests"
          description={
            isAdmin 
              ? "All technicians are on duty and no time-off requests are awaiting review." 
              : "You do not have any pending or past leave requests."
          }
          className="py-8"
        />
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-border/70 shadow-sm">
      <div className="px-5 py-4 border-b border-border/70 bg-surface flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <h3 className="text-base font-bold text-foreground">
            {isAdmin ? 'Team Leave Requests' : 'My Leave Requests'}
          </h3>
        </div>
        {isAdmin && (
          <Badge variant={pendingCount > 0 ? "warning" : "outline"} className="text-xs">
            {pendingCount} Pending Review
          </Badge>
        )}
      </div>

      <div className="p-4">
        <DataTable 
          data={requests}
          loading={loading}
          searchable={isAdmin}
          searchPlaceholder="Search by reason..."
          pagination={true}
          pageSize={6}
          emptyIcon={CalendarOff}
          emptyTitle="No Leave Requests"
          emptyDescription="No leave requests matched the filter."
          columns={[
            ...(isAdmin ? [{
              key: 'worker',
              label: 'Technician',
              render: (req) => (
                <div className="flex items-center gap-2.5">
                  <Avatar 
                    src={req.workerId?.avatarUrl} 
                    fallback={req.workerId?.name || 'T'} 
                    size="sm" 
                  />
                  <div>
                    <div className="text-xs font-bold text-foreground">{req.workerId?.name || 'Technician'}</div>
                    <div className="text-[10px] text-muted-foreground">{req.workerId?.email || ''}</div>
                  </div>
                </div>
              )
            }] : []),
            {
              key: 'dates',
              label: 'Date Range',
              render: (req) => (
                <div className="flex flex-col text-xs">
                  <span className="font-semibold text-foreground">
                    {formatDate(req.startDate)}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    to {formatDate(req.endDate)}
                  </span>
                </div>
              )
            },
            {
              key: 'reason',
              label: 'Reason',
              render: (req) => (
                <div className="max-w-xs text-xs text-muted-foreground line-clamp-2">
                  {req.reason || 'No reason provided'}
                </div>
              )
            },
            {
              key: 'status',
              label: 'Status',
              render: (req) => getStatusBadge(req.status)
            },
            ...(isAdmin ? [{
              key: 'actions',
              label: 'Actions',
              render: (req) => (
                req.status === 'pending' ? (
                  <div className="flex items-center gap-1.5">
                    <Button 
                      size="sm" 
                      variant="primary"
                      isLoading={actionId === req._id}
                      onClick={() => handleApprove(req._id, 'approved')}
                      className="h-7 px-2 text-xs bg-success hover:bg-success-hover text-white border-transparent"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" /> Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      disabled={actionId === req._id}
                      onClick={() => handleApprove(req._id, 'rejected')}
                      className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 border-destructive/30"
                    >
                      <X className="w-3.5 h-3.5 mr-1" /> Decline
                    </Button>
                  </div>
                ) : (
                  <span className="text-[11px] text-muted-foreground capitalize">
                    {req.status}
                  </span>
                )
              )
            }] : [])
          ]}
        />
      </div>
    </Card>
  );
}
