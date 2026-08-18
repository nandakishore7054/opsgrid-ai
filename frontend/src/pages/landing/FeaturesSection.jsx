import React from 'react';
import { motion } from 'framer-motion';
import { 
  Navigation, 
  Map, 
  ShieldAlert, 
  ClipboardList, 
  Radio, 
  Route, 
  BrainCircuit, 
  Lock,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { Badge } from '../../common/components/ui/Badge';

const coreFeatures = [
  {
    icon: Navigation,
    badge: 'Telemetry',
    title: 'Live GPS Telemetry Stream',
    desc: 'High-frequency coordinate streaming via WebSockets with automatic jitter suppression and intelligent speed jump rejection.'
  },
  {
    icon: ShieldAlert,
    badge: 'Spatial GIS',
    title: 'Polygon Geofencing Engine',
    desc: 'Mathematical point-in-polygon boundary detection for real-time site arrival, departure, and customer visit lifecycle tracking.'
  },
  {
    icon: ClipboardList,
    badge: 'Dispatching',
    title: 'Proximity Task Allocation',
    desc: 'Assign field work orders to the closest available technician based on live coordinates, reducing travel overhead and response time.'
  },
  {
    icon: Route,
    badge: 'Distance Engine',
    title: 'Haversine Route Analytics',
    desc: 'Accurate spherical distance computations generate authentic travel logs for operational oversight and mileage audits.'
  },
  {
    icon: BrainCircuit,
    badge: 'Intelligence',
    title: 'Automated AI Shift Reports',
    desc: 'LLM inference engine aggregates raw operational telemetry into human-readable executive summaries at the close of every shift.'
  },
  {
    icon: Lock,
    badge: 'Security',
    title: 'Role-Based Access Control',
    desc: 'Stateless cryptographic JWT authentication with strict role segregation across Administrators, Dispatchers, and Field Technicians.'
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } }
};

export default function FeaturesSection() {
  return (
    <section className="py-24 relative overflow-hidden bg-background">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="primary" className="mb-3 uppercase tracking-wider text-xs">
            Core Architecture
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
            Built for Precision at Enterprise Scale.
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Every feature is engineered for operational speed, deterministic spatial accuracy, and seamless team collaboration.
          </p>
        </div>

        {/* Features Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {coreFeatures.map((feature, idx) => (
            <motion.div 
              key={idx}
              variants={itemVariants}
              className="group relative p-7 rounded-2xl bg-surface border border-border shadow-sm hover:border-primary/50 hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
            >
              {/* Subtle top corner gradient highlight */}
              <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-primary/10 via-transparent to-transparent rounded-tr-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <Badge variant="outline" className="text-[10px] font-semibold">
                    {feature.badge}
                  </Badge>
                </div>

                <h3 className="text-lg font-bold text-foreground mb-2.5 tracking-tight group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-border/60 flex items-center text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <span>Explore capability</span>
                <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
