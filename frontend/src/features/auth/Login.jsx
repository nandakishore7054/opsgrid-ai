import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/auth-context';
import AuthLayout from '../../common/layouts/AuthLayout';
import { Input } from '../../common/components/ui/Input';
import { Button } from '../../common/components/ui/Button';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function validateLoginForm(formState) {
  const errors = {};

  if (!formState.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }

  if (!formState.password) {
    errors.password = 'Password is required.';
  }

  return errors;
}

export default function Login() {
  const navigate = useNavigate();
  const { user, login, isAuthenticated } = useAuth();
  const [formState, setFormState] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverMessage, setServerMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (isAuthenticated) {
    if (user?.role === 'worker') return <Navigate to="/worker/dashboard" replace />;
    if (user?.role === 'dispatcher') return <Navigate to="/admin/dispatch-board" replace />;
    return <Navigate to="/admin/dashboard" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateLoginForm(formState);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setServerMessage('');

    try {
      const payload = await login({
        email: formState.email.trim(),
        password: formState.password,
      });
      let nextRoute = '/admin/dashboard';
      if (payload.user?.role === 'worker') nextRoute = '/worker/dashboard';
      if (payload.user?.role === 'dispatcher') nextRoute = '/admin/dispatch-board';
      
      navigate(nextRoute, { replace: true });
    } catch (error) {
      setServerMessage(error.response?.data?.message || 'Unable to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout 
      title="Welcome back" 
      subtitle="Sign in to your account to continue."
    >
      <form className="space-y-6" onSubmit={handleSubmit} noValidate>
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

        <div className="space-y-2">
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={formState.password}
              onChange={(event) => setFormState({ ...formState, password: event.target.value })}
              placeholder="Enter your password"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.password}
              className="pr-10 h-12 bg-surface-muted/50 border-border/50 focus:bg-background"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex="-1"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex items-center justify-between mt-3">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="w-4 h-4 rounded border border-border/50 bg-surface-muted/50 flex items-center justify-center group-hover:border-primary transition-colors">
                <input type="checkbox" className="opacity-0 absolute" />
                <div className="hidden group-has-[:checked]:block w-2 h-2 bg-primary rounded-[2px]" />
              </div>
              <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Remember me</span>
            </label>
            <Link to="/forgot-password" className="text-sm font-bold text-primary hover:text-primary-hover transition-colors">
              Forgot password?
            </Link>
          </div>
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
          Sign In to Dashboard
        </Button>
      </form>

      <div className="mt-10 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-foreground hover:text-primary transition-colors">
            Create an account
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}