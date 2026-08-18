import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Map, 
  Users, 
  MapPin, 
  CalendarClock, 
  ClipboardCheck, 
  Navigation, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../../app/auth-context';
import { cn } from '../ui/utils';
import { Logo } from '../branding/Logo';

const navGroups = [
  {
    title: 'Overview',
    items: [
      { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/admin/dispatch-board', label: 'Dispatch Board', icon: Map },
    ]
  },
  {
    title: 'Management',
    adminOnly: true,
    items: [
      { to: '/admin/users', label: 'User Management', icon: Users },
      { to: '/admin/geofences', label: 'Geofences', icon: MapPin },
    ]
  },
  {
    title: 'Operations',
    items: [
      { to: '/admin/availability', label: 'Availability', icon: CalendarClock },
      { to: '/admin/attendance', label: 'Attendance', icon: ClipboardCheck },
      { to: '/admin/tracking', label: 'Live Tracking', icon: Navigation },
    ]
  },
  {
    title: 'System',
    items: [
      { to: '/admin/settings', label: 'Settings', icon: Settings },
    ]
  }
];

export default function Sidebar({ isMobileOpen, setIsMobileOpen }) {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', isCollapsed);
  }, [isCollapsed]);

  // Sidebar content (Shared between Desktop and Mobile)
  const SidebarContent = () => (
    <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden custom-scrollbar">
      {/* Brand Logo Area */}
      <div className={cn(
        "flex items-center h-16 flex-shrink-0 px-4 transition-all duration-300 border-b border-border/50",
        isCollapsed ? "justify-center" : "justify-between"
      )}>
        <Link to="/admin/dashboard" className="flex items-center gap-2.5 overflow-hidden">
          <Logo variant={isCollapsed ? "mark" : "full"} size="md" />
        </Link>
        
        {/* Desktop Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "hidden lg:flex items-center justify-center w-6 h-6 rounded-md hover:bg-surface-hover text-muted-foreground transition-colors",
            isCollapsed && "absolute -right-3 top-5 bg-surface border border-border shadow-sm hover:text-foreground z-50"
          )}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Mobile Close Toggle */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden p-2 -mr-2 text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-6">
        {navGroups.map((group, groupIdx) => {
          if (group.adminOnly && user?.role !== 'admin') return null;
          
          return (
            <div key={groupIdx} className="space-y-1">
              {!isCollapsed && (
                <h3 className="px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground/70 mb-2">
                  {group.title}
                </h3>
              )}
              
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end
                    onClick={() => setIsMobileOpen(false)}
                    className={({ isActive }) => cn(
                      "flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 group relative",
                      isActive 
                        ? "bg-primary text-primary-foreground shadow-xs font-bold" 
                        : "text-muted-foreground hover:bg-surface-muted hover:text-foreground",
                      isCollapsed && "justify-center px-0 py-2.5"
                    )}
                  >
                    <item.icon className={cn("w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110 duration-200")} />
                    
                    {!isCollapsed && (
                      <span className="truncate">{item.label}</span>
                    )}

                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-2.5 px-2.5 py-1 bg-surface border border-border text-foreground text-xs rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap font-medium">
                        {item.label}
                      </div>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer Profile / Quick Info */}
      <div className={cn(
        "p-3 border-t border-border/60 bg-surface-muted/20 flex items-center gap-3",
        isCollapsed ? "justify-center" : "justify-start"
      )}>
        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
          {user?.name?.[0]?.toUpperCase() || 'A'}
        </div>
        {!isCollapsed && (
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-foreground truncate">{user?.name || 'Administrator'}</p>
            <p className="text-[10px] text-muted-foreground truncate uppercase font-semibold">{user?.role || 'Admin'}</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside 
        className={cn(
          "hidden lg:flex flex-col border-r border-border bg-surface transition-all duration-300 z-20 h-screen sticky top-0",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
            />

            {/* Slide-over Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-surface border-r border-border z-50 lg:hidden shadow-2xl"
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
