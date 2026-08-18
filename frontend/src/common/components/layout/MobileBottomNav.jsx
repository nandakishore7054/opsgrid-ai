import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, MapPin, CalendarClock, Settings } from 'lucide-react';
import { cn } from '../ui/utils';

const workerNavItems = [
  { to: '/worker/dashboard', label: 'Tasks', icon: LayoutDashboard },
  { to: '/worker/check-in', label: 'Check In', icon: MapPin },
  { to: '/worker/my-availability', label: 'Availability', icon: CalendarClock },
  { to: '/worker/settings', label: 'Settings', icon: Settings },
];

export default function MobileBottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-border/80 bg-surface/95 backdrop-blur-lg px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] shadow-lg lg:hidden">
      {workerNavItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => cn(
            "flex flex-col items-center justify-center min-w-[64px] min-h-[48px] px-2 py-1 rounded-xl transition-all duration-200 active:scale-95 touch-manipulation select-none",
            isActive 
              ? "text-primary bg-primary/10 font-bold" 
              : "text-muted-foreground hover:text-foreground hover:bg-surface-muted/40 font-medium"
          )}
        >
          <item.icon className="w-5 h-5 shrink-0" />
          <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
