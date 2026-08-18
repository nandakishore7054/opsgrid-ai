import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../app/auth-context';
import { AnimatePresence, motion } from 'framer-motion';
import { LogOut, User as UserIcon, Settings, ChevronDown } from 'lucide-react';
import { cn } from '../ui/utils';
import ThemeSwitcher from './ThemeSwitcher';
import { Avatar } from '../ui/Avatar';

export default function UserDropdown() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navigateToSettings = () => {
    const route = user?.role === 'worker' ? '/worker/settings' : '/admin/settings';
    navigate(route);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full border border-border bg-surface hover:bg-surface-hover hover:border-primary/50 transition-colors p-1 pr-3 focus:outline-none focus:ring-2 focus:ring-primary/40"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User account menu"
      >
        <Avatar 
          src={user?.avatarUrl} 
          fallback={user?.name || 'U'} 
          size="md" 
          className="shadow-xs"
        />
        <span className="font-semibold text-xs text-foreground hidden sm:inline-block max-w-[120px] truncate">
          {user?.name || 'User'}
        </span>
        <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 hidden sm:block", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-64 rounded-2xl border border-border/80 bg-surface shadow-xl z-50 overflow-hidden origin-top-right"
          >
            <div className="p-4 border-b border-border/70 bg-surface-muted/30">
              <p className="font-bold text-sm text-foreground truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{user?.email}</p>
              <div className="mt-2 inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider text-primary uppercase">
                {user?.role}
              </div>
            </div>

            <div className="p-2 space-y-1">
              <button
                onClick={navigateToSettings}
                className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-foreground hover:bg-surface-muted hover:text-primary transition-colors text-left"
              >
                <Settings className="w-4 h-4 text-muted-foreground" />
                <span>Account Settings</span>
              </button>
            </div>

            <div className="p-2 border-t border-border/70">
              <div className="px-3 py-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Theme</span>
                <ThemeSwitcher />
              </div>
            </div>

            <div className="p-2 border-t border-border/70">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
