import React from 'react';
import { CheckCircle2, ShieldCheck, Zap, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import ThemeSwitcher from '../components/layout/ThemeSwitcher';
import { Logo } from '../components/branding/Logo';

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground transition-colors duration-300">
      
      {/* Left Column: Branding / Visual (Hidden on small screens) */}
      <div className="hidden md:flex md:w-1/2 lg:w-[55%] relative overflow-hidden bg-slate-950 items-center justify-center p-12 lg:p-20">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 -left-1/4 w-full h-full bg-primary/20 blur-[120px] rounded-full mix-blend-screen opacity-50" />
          <div className="absolute bottom-0 -right-1/4 w-full h-full bg-info/20 blur-[120px] rounded-full mix-blend-screen opacity-50" />
        </div>
        
        <div className="relative z-10 text-white w-full max-w-xl h-full flex flex-col justify-between">
          <div>
            <div className="mb-16">
              <Logo to="/" size="lg" forceTheme="dark" />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight mb-6 tracking-tight">
                Empower Your Field Operations.
              </h1>
              <p className="text-base text-slate-300 font-medium leading-relaxed mb-10 max-w-md">
                Enterprise workforce management system engineered for high availability, real-time geofencing, and automated field dispatching.
              </p>

              <div className="space-y-4">
                {[
                  { icon: Zap, text: "Real-time task dispatch and tracking" },
                  { icon: Globe, text: "Live geofencing and GPS verification" },
                  { icon: CheckCircle2, text: "Automated compliance and shift logging" }
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <feature.icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-slate-200 text-sm font-semibold">{feature.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
          
          <div className="mt-16 pt-8 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs font-semibold text-slate-300">Enterprise Operations & GPS Verification</span>
            </div>

            <span className="text-xs text-slate-400 font-medium">OpsGrid v1.0</span>
          </div>
        </div>
      </div>

      {/* Right Column: Form Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden">
        {/* Mobile Header */}
        <div className="absolute top-6 left-6 md:hidden">
          <Logo to="/" size="md" />
        </div>

        <div className="absolute top-6 right-6">
          <ThemeSwitcher />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mb-2">{title}</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">{subtitle}</p>
          </div>
          
          {children}
        </motion.div>
      </div>

    </div>
  );
}
