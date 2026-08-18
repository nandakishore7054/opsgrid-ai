import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/auth-context';
import AuthLayout from '../../common/layouts/AuthLayout';
import { Input } from '../../common/components/ui/Input';
import { Button } from '../../common/components/ui/Button';
import { Mail, Lock, Eye, EyeOff, User, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Select } from '../../common/components/ui/Select';

const roles = [
  { value: 'admin', label: 'Admin' },
  { value: 'worker', label: 'Worker' },
  { value: 'dispatcher', label: 'Dispatcher' },
];

function validateRegistrationForm(formState) {
  const errors = {};

  if (!formState.name.trim()) {
    errors.name = 'Name is required.';
  }

  if (!formState.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }

  if (!formState.password) {
    errors.password = 'Password is required.';
  } else if (formState.password.length < 8) {
    errors.password = 'Password must be at least 8 characters long.';
  }

  if (formState.password !== formState.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  if (!formState.role) {
    errors.role = 'Role is required.';
  }

  return errors;
}

export default function Register() {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'worker',
  });
  const [errors, setErrors] = useState({});
  const [serverMessage, setServerMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateRegistrationForm(formState);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setServerMessage('');

    try {
      await register({
        name: formState.name.trim(),
        email: formState.email.trim(),
        password: formState.password,
        role: formState.role,
      });

      navigate('/login', {
        replace: true,
        state: { message: 'Account created successfully. Please sign in.' },
      });
    } catch (error) {
      setServerMessage(error.response?.data?.message || 'Unable to create the account.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout 
      title="Create account" 
      subtitle="Register to start managing field work."
    >
      <form className="space-y-6" onSubmit={handleSubmit} noValidate>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full name</label>
          <Input
            type="text"
            value={formState.name}
            onChange={(event) => setFormState({ ...formState, name: event.target.value })}
            placeholder="Ava Johnson"
            leftIcon={<User className="w-4 h-4" />}
            error={errors.name}
            className="h-12 bg-surface-muted/50 border-border/50 focus:bg-background"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
          <Input
            type="email"
            value={formState.email}
            onChange={(event) => setFormState({ ...formState, email: event.target.value })}
            placeholder="you@example.com"
            leftIcon={<Mail className="w-4 h-4" />}
            error={errors.email}
            className="h-12 bg-surface-muted/50 border-border/50 focus:bg-background"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Password</label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={formState.password}
                onChange={(event) => setFormState({ ...formState, password: event.target.value })}
                placeholder="Min 8 characters"
                leftIcon={<Lock className="w-4 h-4" />}
                error={errors.password}
                className="pr-10 h-12 bg-surface-muted/50 border-border/50 focus:bg-background"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex="-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground font-medium">Must be at least 8 characters</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Confirm password</label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                value={formState.confirmPassword}
                onChange={(event) => setFormState({ ...formState, confirmPassword: event.target.value })}
                placeholder="Repeat password"
                leftIcon={<Lock className="w-4 h-4" />}
                error={errors.confirmPassword}
                className="pr-10 h-12 bg-surface-muted/50 border-border/50 focus:bg-background"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex="-1"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Role</label>
          <Select
            value={formState.role}
            onChange={(event) => setFormState({ ...formState, role: event.target.value })}
            icon={Briefcase}
            options={roles}
            error={errors.role}
            className="h-12 bg-surface-muted/50 border-border/50 focus:bg-background"
          />
        </div>

        <AnimatePresence>
          {serverMessage && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-xl bg-destructive/10 px-4 py-3 border border-destructive/20 text-sm text-destructive flex items-start gap-3"
            >
              <span>{serverMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          type="submit"
          isLoading={isSubmitting}
          className="w-full mt-2 h-12 text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-bold"
          size="lg"
        >
          Create Account
        </Button>
      </form>

      <div className="mt-10 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-foreground hover:text-primary transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}