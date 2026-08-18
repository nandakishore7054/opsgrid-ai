import { useState, useEffect, useMemo } from 'react';
import api from '../../app/api';
import { motion } from 'framer-motion';
import { 
  Users, Search, Filter, Shield, ShieldAlert, Activity, Power, PowerOff, UserCircle, 
  ChevronLeft, ChevronRight, RefreshCcw, MoreVertical, X
} from 'lucide-react';
import { Card } from '../../common/components/ui/Card';
import { Input } from '../../common/components/ui/Input';
import { Button } from '../../common/components/ui/Button';
import { Badge } from '../../common/components/ui/Badge';
import { Skeleton } from '../../common/components/ui/Skeleton';
import { EmptyState } from '../../common/components/ui/EmptyState';
import { DataTable } from '../../common/components/ui/DataTable';

import { PageHeader } from '../../common/components/ui/PageHeader';
import { AlertDialog } from '../../common/components/ui/AlertDialog';
import { Avatar } from '../../common/components/ui/Avatar';
import { StatCard } from '../../common/components/ui/StatCard';
import { Select } from '../../common/components/ui/Select';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [alertConfig, setAlertConfig] = useState({ isOpen: false });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit: 10,
        search,
      });
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('status', statusFilter);

      const response = await api.get(`/users?${params.toString()}`);
      setUsers(response.data?.data?.users || []);
      setTotalPages(response.data?.data?.totalPages || 1);
    } catch (err) {
      setError('Failed to load users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search, roleFilter, statusFilter]);

  const handleStatusChange = (userId, newStatus) => {
    setAlertConfig({
      isOpen: true,
      title: 'Change User Status',
      description: `Are you sure you want to change this user's status to ${newStatus}?`,
      intent: 'warning',
      confirmLabel: 'Change Status',
      onConfirm: async () => {
        setAlertConfig({ isOpen: false });
        try {
          await api.put(`/users/${userId}/status`, { status: newStatus });
          fetchUsers();
        } catch (err) {
          console.error('Failed to update status', err);
          alert('Failed to update status');
        }
      }
    });
  };

  const handleRoleChange = (userId, newRole) => {
    setAlertConfig({
      isOpen: true,
      title: 'Change User Role',
      description: `Are you sure you want to change this user's role to ${newRole}?`,
      intent: 'warning',
      confirmLabel: 'Change Role',
      onConfirm: async () => {
        setAlertConfig({ isOpen: false });
        try {
          await api.put(`/users/${userId}/role`, { role: newRole });
          fetchUsers();
        } catch (err) {
          console.error('Failed to update role', err);
          alert('Failed to update role');
        }
      }
    });
  };

  const clearFilters = () => {
    setSearch('');
    setRoleFilter('');
    setStatusFilter('');
    setPage(1);
  };

  // Compute stats based on CURRENT page since it's paginated on backend
  const activeCount = users.filter(u => u.status === 'active').length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const workerCount = users.filter(u => u.role === 'worker').length;

  return (
    <div className="flex flex-col gap-6 min-h-[calc(100vh-80px)] max-w-[1600px] mx-auto pb-10">
      
      <PageHeader
        title="User Management"
        description="Manage all users, roles, and access across the organization"
        icon={Users}
        variant="prominent"
        actions={
          <Button onClick={() => fetchUsers()} variant="outline" className="gap-2">
            <RefreshCcw className="w-4 h-4" /> Refresh
          </Button>
        }
      />

      {/* Statistics Cards (Current Page) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Page Total', value: users.length, icon: Users, colorClass: 'text-indigo-600 dark:text-indigo-400', bgClass: 'bg-indigo-50 dark:bg-indigo-900/20' },
          { label: 'Active (Page)', value: activeCount, icon: Activity, colorClass: 'text-success dark:text-success-hover', bgClass: 'bg-success/10' },
          { label: 'Admins (Page)', value: adminCount, icon: Shield, colorClass: 'text-primary dark:text-primary-hover', bgClass: 'bg-primary/10' },
          { label: 'Workers (Page)', value: workerCount, icon: UserCircle, colorClass: 'text-info dark:text-info-hover', bgClass: 'bg-info/10' },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <StatCard 
              title={stat.label}
              value={stat.value}
              icon={stat.icon}
              variant="interactive"
              colorScheme={
                stat.colorClass.includes('success') ? 'success' :
                stat.colorClass.includes('primary') ? 'primary' :
                stat.colorClass.includes('info') ? 'info' : 'default'
              }
            />
          </motion.div>
        ))}
      </div>

      {/* Main Content Area */}
      <DataTable
        data={users}
        loading={loading}
        searchable={true}
        searchValue={search}
        onSearchChange={(val) => { setSearch(val); setPage(1); }}
        pagination={true}
        page={page}
        totalPages={totalPages}
        onPageChange={(p) => setPage(p)}
        emptyIcon={Search}
        emptyTitle="No workers found"
        emptyDescription="Try adjusting your search filters or invite a new worker to the system."
        emptyPrimaryAction={<Button variant="default">Invite Worker</Button>}
        emptySecondaryAction={(search || roleFilter || statusFilter) ? <Button onClick={clearFilters} variant="outline">Clear Filters</Button> : null}
        actions={
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1 sm:w-40">
              <Select 
                value={roleFilter} 
                onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                icon={Filter}
                options={[
                  { value: '', label: 'All Roles' },
                  { value: 'admin', label: 'Admin' },
                  { value: 'dispatcher', label: 'Dispatcher' },
                  { value: 'worker', label: 'Worker' }
                ]}
              />
            </div>
            
            <div className="relative flex-1 sm:w-40">
              <Select 
                value={statusFilter} 
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                icon={Filter}
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' }
                ]}
              />
            </div>

            {(search || roleFilter || statusFilter) && (
              <Button variant="ghost" size="icon" onClick={clearFilters} className="h-10 w-10 shrink-0 text-muted-foreground hover:text-destructive" title="Clear Filters">
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        }
        columns={[
          {
            key: 'name',
            label: 'User',
            render: (u) => (
              <div className="flex items-center gap-3">
                <Avatar 
                  src={u.avatarUrl} 
                  fallback={u.name} 
                  size="lg" 
                  className="group-hover:ring-2 ring-primary/20 transition-all shadow-sm" 
                />
                <div>
                  <p className="font-bold text-foreground">{u.name}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
              </div>
            )
          },
          {
            key: 'role',
            label: 'Role',
            sortable: false,
            render: (u) => (
              <div className="relative inline-block w-32">
                <Select 
                  value={u.role}
                  onChange={(e) => handleRoleChange(u._id, e.target.value)}
                  className="!h-8 !py-1 !px-2 capitalize border-transparent hover:border-border bg-transparent hover:bg-background"
                  options={[
                    { value: 'admin', label: 'Admin' },
                    { value: 'dispatcher', label: 'Dispatcher' },
                    { value: 'worker', label: 'Worker' }
                  ]}
                />
              </div>
            )
          },
          {
            key: 'status',
            label: 'Status',
            render: (u) => (
              <Badge variant={u.status === 'active' ? 'success' : 'destructive'} className="uppercase text-[10px] tracking-wider px-2.5 py-1">
                {u.status}
              </Badge>
            )
          },
          {
            key: 'actions',
            label: 'Actions',
            align: 'right',
            sortable: false,
            render: (u) => (
              <Button
                variant={u.status === 'active' ? 'outline' : 'default'}
                size="sm"
                onClick={() => handleStatusChange(u._id, u.status === 'active' ? 'inactive' : 'active')}
                className={`gap-2 ${u.status === 'active' ? 'hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30' : 'bg-success hover:bg-success-hover text-success-foreground'}`}
              >
                {u.status === 'active' ? (
                  <><PowerOff className="w-3.5 h-3.5" /> Deactivate</>
                ) : (
                  <><Power className="w-3.5 h-3.5" /> Activate</>
                )}
              </Button>
            )
          }
        ]}
      />

      
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
