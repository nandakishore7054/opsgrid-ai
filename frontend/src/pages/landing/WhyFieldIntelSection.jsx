import React from 'react';
import { motion } from 'framer-motion';
import { 
  XCircle, 
  CheckCircle2, 
  Layers, 
  Radio, 
  ShieldAlert, 
  Clock, 
  BrainCircuit,
  Workflow
} from 'lucide-react';
import { Badge } from '../../common/components/ui/Badge';

const comparisonPoints = [
  {
    category: 'Workforce Tracking',
    legacy: 'Periodic phone calls, text messages, and unverified self-reporting.',
    opsgrid: 'Continuous sub-second GPS streaming with automatic jitter and drift suppression.'
  },
  {
    category: 'Site Attendance',
    legacy: 'Paper sign-in sheets and easily manipulated manual check-ins.',
    opsgrid: 'Mathematically validated polygon geofences with automated shift grace periods.'
  },
  {
    category: 'Task Dispatch',
    legacy: 'Manual calling to ask who is available and nearest to a job site.',
    opsgrid: 'Automated Haversine proximity calculations pair tasks with the nearest active technician.'
  },
  {
    category: 'Visit Logging',
    legacy: 'Untracked arrival and departure times leading to customer disputes.',
    opsgrid: 'Automated CustomerVisit lifecycle with self-healing recovery and exact timestamps.'
  },
  {
    category: 'Shift Summaries',
    legacy: 'Manual daily log reconciliation taking hours at the end of each shift.',
    opsgrid: 'Automated AI operational synthesis aggregates thousands of events in seconds.'
  }
];

export default function WhyFieldIntelSection() {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="primary" className="mb-3 uppercase tracking-wider text-xs">
            The OpsGrid Advantage
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
            Why Modern Teams Migrate to OpsGrid.
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Replace fragmented tools and manual coordination with a unified, deterministic operations platform.
          </p>
        </div>

        {/* Side-by-Side Comparison Matrix */}
        <div className="max-w-5xl mx-auto rounded-2xl border border-border bg-surface shadow-md overflow-hidden">
          {/* Header Row */}
          <div className="grid grid-cols-1 md:grid-cols-12 border-b border-border bg-surface-muted/60 p-4 text-xs font-bold uppercase tracking-wider">
            <div className="md:col-span-3 text-muted-foreground hidden md:block">Operational Domain</div>
            <div className="md:col-span-4 text-destructive/90 flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-destructive" />
              <span>Legacy / Fragmented Process</span>
            </div>
            <div className="md:col-span-5 text-primary flex items-center gap-1.5 mt-2 md:mt-0">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>OpsGrid Unified Platform</span>
            </div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-border">
            {comparisonPoints.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="grid grid-cols-1 md:grid-cols-12 p-5 gap-3 md:gap-4 items-center hover:bg-surface-muted/30 transition-colors"
              >
                <div className="md:col-span-3 text-xs font-bold text-foreground">
                  {item.category}
                </div>
                <div className="md:col-span-4 text-xs text-muted-foreground leading-relaxed flex items-start gap-2">
                  <span className="text-destructive font-bold md:hidden">•</span>
                  <span>{item.legacy}</span>
                </div>
                <div className="md:col-span-5 text-xs text-foreground font-medium leading-relaxed flex items-start gap-2 bg-primary/5 p-3 rounded-lg md:bg-transparent md:p-0">
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                  <span>{item.opsgrid}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
