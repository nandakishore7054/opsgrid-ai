import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '../../common/components/ui/Badge';
import { 
  Layers, 
  Server, 
  Database, 
  Radio, 
  Map, 
  Cpu, 
  ShieldCheck, 
  Smartphone 
} from 'lucide-react';

const technologies = [
  { name: 'React 18', role: 'Reactive Frontend SPA', icon: Layers },
  { name: 'Node.js & Express', role: 'Asynchronous Core Engine', icon: Server },
  { name: 'MongoDB Geospatial', role: '2dsphere Polygon Indexing', icon: Database },
  { name: 'Socket.IO', role: 'Bidirectional Telemetry Stream', icon: Radio },
  { name: 'Leaflet & Turf.js', role: 'Point-in-Polygon Engine', icon: Map },
  { name: 'Llama 3 & Gemini', role: 'Automated Shift Synthesis', icon: Cpu },
  { name: 'JWT & BCrypt', role: 'Cryptographic Auth Layer', icon: ShieldCheck },
  { name: 'Progressive Web App', role: 'Field Technician Offline Cache', icon: Smartphone }
];

export default function TechStackSection() {
  return (
    <section className="py-20 bg-surface/50 border-t border-border">
      <div className="max-w-7xl mx-auto px-6 text-center">
        
        <div className="max-w-3xl mx-auto mb-12">
          <Badge variant="outline" className="mb-2.5 uppercase tracking-wider text-xs">
            Infrastructure & Stack
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mb-3">
            Built on Deterministic, Open Standards.
          </h2>
          <p className="text-sm text-muted-foreground">
            Zero proprietary hardware lock-in. Powered by proven open-source geospatial frameworks and low-latency protocols.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {technologies.map((tech, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: idx * 0.04 }}
              className="p-4 rounded-xl border border-border bg-background shadow-sm hover:border-primary/40 transition-all flex flex-col items-center text-center"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2.5">
                <tech.icon className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm text-foreground">{tech.name}</span>
              <span className="text-[11px] font-medium text-muted-foreground mt-0.5">{tech.role}</span>
            </motion.div>
          ))}
        </div>
        
      </div>
    </section>
  );
}
