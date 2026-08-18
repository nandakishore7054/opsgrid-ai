import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../app/api';
import AuthLayout from '../../common/layouts/AuthLayout';
import { Input } from '../../common/components/ui/Input';
import { Button } from '../../common/components/ui/Button';
import { Mail, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [serverMessage, setServerMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setServerMessage('');

    if (!email.trim()) {
      setError('Email is required.');
      return;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSuccess(true);
    } catch (err) {
      setServerMessage(err.response?.data?.message || 'Unable to process request.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout 
      title="Reset password" 
      subtitle="Enter your email to receive a reset link."
    >
      {success ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6 text-center"
        >
          <div className="rounded-2xl bg-primary/10 px-6 py-8 border border-primary/20 flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4 text-primary">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-foreground font-semibold text-lg">Reset link sent!</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-[250px] mx-auto">
              Check your email for the password reset link. It may take a few minutes.
            </p>
          </div>
          <Link to="/login" className="inline-block font-semibold text-primary hover:text-primary-hover transition-colors">
            Return to login
          </Link>
        </motion.div>
      ) : (
        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              leftIcon={<Mail className="w-4 h-4" />}
              error={error}
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
            Send Reset Link
          </Button>
          
          <div className="mt-8 text-center">
            <Link to="/login" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
              Return to login
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
