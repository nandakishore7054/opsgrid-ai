import React from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  MapPin, 
  Users, 
  CalendarCheck, 
  ShieldCheck, 
  LineChart,
  CheckCircle2
} from 'lucide-react';
import { Badge } from '../../common/components/ui/Badge';

const operationalBenefits = [
  {
    icon: Zap,
    title: 'Real-Time Operational Agility',
    subtitle: 'Eliminate Communication Delays',
    description: 'Dispatch coordinators and managers observe field events as they occur. Bidirectional sockets remove the need for periodic phone checks and status chasing.',
    points: ['Instant status sync across devices', 'Zero manual refresh overhead', 'Active incident reassignment']
  },
  {
    icon: MapPin,
    title: 'Deterministic GPS Tracking',
    subtitle: 'Verifiable Location Precision',
    description: 'Continuous location telemetry provides an indisputable audit trail of field routes, preventing unverified travel and ensuring technician safety.',
    points: ['Jitter & stationary drift suppression', '150 km/h speed violation barrier', 'Accurate historical breadcrumb trails']
  },
  {
    icon: Users,
    title: 'Unified Workforce Coordination',
    subtitle: 'Centralized Field Governance',
    description: 'Structure complex field teams across dispatchers and technicians with role-specific views, availability scheduling, and leave management.',
    points: ['Granular access permissions', 'Availability and shift scheduling', 'Direct task dispatch queue']
  },
  {
    icon: CalendarCheck,
    title: 'Automated Shift Attendance',
    subtitle: 'Tamper-Proof Time Tracking',
    description: 'Shift check-in is physically bounded to designated workplace geofences, ensuring attendance records reflect genuine physical presence.',
    points: ['Automated grace period rules', 'Office polygon validation', 'Accurate worked-hours auditing']
  },
  {
    icon: ShieldCheck,
    title: 'Automated Geofence Compliance',
    subtitle: 'Self-Healing Visit Logging',
    description: 'Customer visits and site arrivals are logged automatically upon entering defined polygon boundaries, eliminating paper-based logs.',
    points: ['Zero-touch visit creation', 'Automatic departure recording', 'Stale visit recovery guard']
  },
  {
    icon: LineChart,
    title: 'Comprehensive Operations Analytics',
    subtitle: 'Data-Driven Field Optimization',
    description: 'Gain executive-level clarity into team travel distances, task completion velocity, and operational bottlenecks across all territories.',
    points: ['Haversine travel distance engine', 'Automated end-of-shift AI digests', 'Real-time KPI status monitoring']
  }
];

export default function BenefitsSection() {
  return (
    <section className="py-24 bg-surface border-y border-border relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="primary" className="mb-3 uppercase tracking-wider text-xs">
            Operational Value
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
            Transforming Field Management From Guesswork to Certainty.
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Move away from disconnected spreadsheets, phone calls, and manual time sheets with a unified system of record.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {operationalBenefits.map((benefit, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.07 }}
              className="p-7 rounded-2xl bg-background border border-border shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5">
                  <benefit.icon className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
                  {benefit.subtitle}
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3 tracking-tight">
                  {benefit.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  {benefit.description}
                </p>
              </div>

              <ul className="space-y-2.5 pt-4 border-t border-border/70 text-xs font-medium text-foreground">
                {benefit.points.map((point, pIdx) => (
                  <li key={pIdx} className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
