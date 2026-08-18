import { useState, useEffect } from 'react';
import imageCompression from 'browser-image-compression';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  User, 
  Camera, 
  Lock, 
  Palette, 
  Save, 
  Bell, 
  ShieldCheck, 
  Sun, 
  Moon, 
  Monitor, 
  LogOut, 
  CheckCircle2,
  Mail,
  Phone,
  AlertCircle,
  Radio,
  MapPin,
  ClipboardList,
  CalendarClock
} from 'lucide-react';
import toast from 'react-hot-toast';

import api from '../app/api';
import { useAuth } from '../app/auth-context';
import { useTheme } from '../app/theme-context';
import { PageHeader } from '../common/components/ui/PageHeader';
import { Card } from '../common/components/ui/Card';
import { Input } from '../common/components/ui/Input';
import { Button } from '../common/components/ui/Button';
import { Badge } from '../common/components/ui/Badge';
import { Avatar } from '../common/components/ui/Avatar';
import { AlertDialog } from '../common/components/ui/AlertDialog';

const NOTIFICATION_PREF_KEY = 'sfo_notification_preferences';

export default function Settings() {
  const { user, setUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  // Profile Form State
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Security / Password Form State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Notification Preferences State (Persisted in localStorage)
  const [notifPrefs, setNotifPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem(NOTIFICATION_PREF_KEY);
      return saved ? JSON.parse(saved) : {
        taskUpdates: true,
        geofenceAlerts: true,
        shiftReminders: true
      };
    } catch (_e) {
      return { taskUpdates: true, geofenceAlerts: true, shiftReminders: true };
    }
  });

  // Sign out modal state
  const [showSignOutAlert, setShowSignOutAlert] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setAvatarUrl(user.avatarUrl || '');
    }
  }, [user]);

  // Image Upload / Compression
  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 400,
        useWebWorker: true,
      });
      setAvatarFile(compressed);
      setAvatarUrl(URL.createObjectURL(compressed));
      toast.success('Avatar image ready for upload');
    } catch (err) {
      toast.error('Failed to process avatar image');
    }
  }

  async function uploadToCloudinary(file) {
    const signatureResponse = await api.get('/upload/signature');
    const signaturePayload = signatureResponse.data?.data || {};

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', signaturePayload.apiKey);
    formData.append('timestamp', signaturePayload.timestamp);
    formData.append('signature', signaturePayload.signature);
    formData.append('folder', signaturePayload.folder);

    const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${signaturePayload.cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!uploadResponse.ok) {
      throw new Error('Image upload service unavailable.');
    }

    const uploadResult = await uploadResponse.json();
    return uploadResult.secure_url;
  }

  // 1. Profile Update Handler
  async function handleProfileSubmit(e) {
    e.preventDefault();
    setSavingProfile(true);

    try {
      let uploadedAvatarUrl = avatarUrl;
      if (avatarFile) {
        uploadedAvatarUrl = await uploadToCloudinary(avatarFile);
      }

      const payload = { name, phone };
      if (uploadedAvatarUrl !== user?.avatarUrl) {
        payload.avatarUrl = uploadedAvatarUrl;
      }

      const response = await api.put('/users/me', payload);
      setUser(response.data?.data?.user);
      setAvatarFile(null);
      toast.success('Profile updated successfully');
    } catch (err) {
      const errorMsg = err.response?.data?.error?.message || err.message || 'Failed to update profile.';
      toast.error(errorMsg);
    } finally {
      setSavingProfile(false);
    }
  }

  // 2. Password Update Handler
  async function handlePasswordSubmit(e) {
    e.preventDefault();
    if (!newPassword) {
      toast.error('Please enter a new password');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setSavingPassword(true);
    try {
      const response = await api.put('/users/me', { password: newPassword });
      setUser(response.data?.data?.user);
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password updated successfully');
    } catch (err) {
      const errorMsg = err.response?.data?.error?.message || err.message || 'Failed to update password.';
      toast.error(errorMsg);
    } finally {
      setSavingPassword(false);
    }
  }

  // 3. Notification Toggle Handler
  function handleToggleNotification(key) {
    const updated = {
      ...notifPrefs,
      [key]: !notifPrefs[key]
    };
    setNotifPrefs(updated);
    try {
      localStorage.setItem(NOTIFICATION_PREF_KEY, JSON.stringify(updated));
      toast.success('Notification preference updated');
    } catch (_err) {
      // LocalStorage fallback
    }
  }

  const roleLabel = user?.role === 'admin' 
    ? 'Administrator' 
    : user?.role === 'dispatcher' 
    ? 'Operations Dispatcher' 
    : 'Field Technician';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7">
      
      {/* Standardized Header */}
      <PageHeader
        title="Settings & Preferences"
        description="Manage your operational profile, credentials, notification alerts, and application theme."
        icon={SettingsIcon}
        actions={
          <Badge variant="outline" className="text-xs px-3 py-1 font-semibold uppercase tracking-wider">
            {roleLabel}
          </Badge>
        }
      />

      <div className="space-y-6">

        {/* 1. Profile Information Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className="p-6 sm:p-7 border-border/70 bg-surface shadow-sm">
            <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-border/70">
              <User className="w-5 h-5 text-primary" />
              <div>
                <h2 className="text-base font-bold text-foreground">Profile Information</h2>
                <p className="text-xs text-muted-foreground">Personal details and identity representation</p>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-6">
              {/* Avatar Section */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-surface-muted/30 border border-border/60">
                <div className="relative group">
                  <Avatar 
                    src={avatarUrl} 
                    fallback={name || user?.email || 'U'} 
                    size="2xl" 
                    className="border-2 border-border/80 shadow-sm"
                  />
                  <label 
                    className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary-hover transition-transform shadow-md group-hover:scale-105"
                    title="Change profile avatar"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                </div>
                <div className="text-center sm:text-left space-y-1">
                  <div className="text-sm font-bold text-foreground">{user?.email}</div>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <Badge variant="primary" className="text-[10px] capitalize">
                      {user?.role} Account
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">Click camera icon to upload photo</span>
                  </div>
                </div>
              </div>

              {/* Form Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Full Name
                  </label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Your full name"
                    className="bg-background"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Phone Number
                  </label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="bg-background"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Email Address
                </label>
                <Input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-surface-muted/50 text-muted-foreground cursor-not-allowed border-dashed"
                />
                <span className="text-[11px] text-muted-foreground">Email address is managed by your organization.</span>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  isLoading={savingProfile}
                  className="gap-2 shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Profile</span>
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>

        {/* 2. Security & Password Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
          <Card className="p-6 sm:p-7 border-border/70 bg-surface shadow-sm">
            <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-border/70">
              <Lock className="w-5 h-5 text-primary" />
              <div>
                <h2 className="text-base font-bold text-foreground">Security & Credentials</h2>
                <p className="text-xs text-muted-foreground">Update your account authentication password</p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                    New Password
                  </label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="bg-background"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Confirm New Password
                  </label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="bg-background"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-muted-foreground">
                  Leave fields empty if you do not wish to change your password.
                </span>
                <Button
                  type="submit"
                  variant="outline"
                  isLoading={savingPassword}
                  disabled={!newPassword}
                  className="gap-2"
                >
                  <Lock className="w-3.5 h-3.5 text-primary" />
                  <span>Update Password</span>
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>

        {/* 3. Operational Notification Preferences Card (Roadmap Task 3.10) */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <Card className="p-6 sm:p-7 border-border/70 bg-surface shadow-sm">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-border/70">
              <div className="flex items-center gap-2.5">
                <Bell className="w-5 h-5 text-primary" />
                <div>
                  <h2 className="text-base font-bold text-foreground">Operational Alerts & Notifications</h2>
                  <p className="text-xs text-muted-foreground">Configure client-side notification preferences for this browser</p>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px]">Client Preferences</Badge>
            </div>

            <div className="space-y-3.5">
              {/* Task Updates Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-background hover:bg-surface-muted/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <ClipboardList className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">Task & Dispatch Assignments</div>
                    <div className="text-[11px] text-muted-foreground">Real-time alerts when work orders or dispatch schedules are assigned.</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleNotification('taskUpdates')}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 border ${
                    notifPrefs.taskUpdates ? 'bg-primary border-primary' : 'bg-surface-muted border-border'
                  }`}
                >
                  <div className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                    notifPrefs.taskUpdates ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Geofence Alerts Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-background hover:bg-surface-muted/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-warning/10 text-warning flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">Geofence Boundary Events</div>
                    <div className="text-[11px] text-muted-foreground">Arrival and departure notices at client premises and site boundaries.</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleNotification('geofenceAlerts')}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 border ${
                    notifPrefs.geofenceAlerts ? 'bg-primary border-primary' : 'bg-surface-muted border-border'
                  }`}
                >
                  <div className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                    notifPrefs.geofenceAlerts ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Shift Reminders Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-background hover:bg-surface-muted/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-success/10 text-success flex items-center justify-center">
                    <CalendarClock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">Shift & Attendance Reminders</div>
                    <div className="text-[11px] text-muted-foreground">Reminders for scheduled shift start times and check-ins.</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleNotification('shiftReminders')}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 border ${
                    notifPrefs.shiftReminders ? 'bg-primary border-primary' : 'bg-surface-muted border-border'
                  }`}
                >
                  <div className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                    notifPrefs.shiftReminders ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* 4. Appearance & Display Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}>
          <Card className="p-6 sm:p-7 border-border/70 bg-surface shadow-sm">
            <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-border/70">
              <Palette className="w-5 h-5 text-primary" />
              <div>
                <h2 className="text-base font-bold text-foreground">Appearance & Theme</h2>
                <p className="text-xs text-muted-foreground">Select your interface color theme</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'light', label: 'Light', icon: Sun, desc: 'High contrast light theme' },
                { id: 'dark', label: 'Dark', icon: Moon, desc: 'Low eye strain dark theme' },
                { id: 'system', label: 'System', icon: Monitor, desc: 'Syncs with operating system' }
              ].map((opt) => {
                const Icon = opt.icon;
                const isSelected = theme === opt.id;

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTheme(opt.id)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/30 shadow-xs'
                        : 'border-border/60 bg-background hover:bg-surface-muted/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary/10 text-primary' : 'bg-surface-muted text-muted-foreground'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                    </div>
                    <div className="text-xs font-bold text-foreground">{opt.label}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </Card>
        </motion.div>

        {/* 5. Account & Session Safeguards */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
          <Card className="p-6 sm:p-7 border-border/70 bg-surface shadow-sm">
            <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-border/70">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <div>
                <h2 className="text-base font-bold text-foreground">Session & Account Information</h2>
                <p className="text-xs text-muted-foreground">Active authentication session and sign-out controls</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-surface-muted/30 border border-border/60 mb-6">
              <div className="space-y-1">
                <div className="text-xs font-bold text-foreground flex items-center gap-2">
                  <span>{user?.name}</span>
                  <Badge variant="outline" className="text-[10px] py-0">{user?.role}</Badge>
                </div>
                <div className="text-[11px] text-muted-foreground">{user?.email}</div>
              </div>
              <div className="text-xs text-muted-foreground font-medium">
                Active Session Token Authenticated
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowSignOutAlert(true)}
                className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out of OpsGrid</span>
              </Button>
            </div>
          </Card>
        </motion.div>

      </div>

      {/* Confirmation Modal for Sign Out */}
      <AlertDialog
        isOpen={showSignOutAlert}
        onClose={() => setShowSignOutAlert(false)}
        onConfirm={logout}
        title="Sign Out Confirmation"
        description="Are you sure you want to end your current active session on this device?"
        confirmText="Sign Out"
        variant="danger"
      />

    </div>
  );
}
