import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../app/api';
import AuthLayout from '../../common/layouts/AuthLayout';
import { Input } from '../../common/components/ui/Input';
import { Button } from '../../common/components/ui/Button';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [formState, setFormState] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [serverMessage, setServerMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true });
    }
  }, [token, navigate]);

  function validateResetForm() {
    const nextErrors = {};

    if (!formState.password) {
      nextErrors.password = 'Password is required.';
    } else if (formState.password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters long.';
    }

    if (formState.password !== formState.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    return nextErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateResetForm();
    setErrors(nextErrors);
    setServerMessage('');

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post('/auth/reset-password', {
        token,
        newPassword: formState.password,
      });

      navigate('/login', {
        replace: true,
        state: { message: 'Password reset successfully. Please sign in with your new password.' },
      });
    } catch (err) {
      setServerMessage(err.response?.data?.message || 'Unable to reset password. The link may have expired.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!token) return null;

  return (
    <AuthLayout 
      title="Create new password" 
      subtitle="Please enter your new password below."
    >
      <form className="space-y-6" onSubmit={handleSubmit} noValidate>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">New password</label>
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
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Confirm new password</label>
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
          className="w-full mt-4 h-12 text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-bold"
          size="lg"
        >
          Reset Password
        </Button>
      </form>
    </AuthLayout>
  );
}
