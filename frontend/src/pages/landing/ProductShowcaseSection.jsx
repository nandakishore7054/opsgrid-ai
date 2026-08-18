import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '../../common/components/ui/Badge';
import { 
  Navigation, 
  MapPin, 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  Layers, 
  Battery, 
  Signal, 
  ArrowUpRight,
  BrainCircuit,
  PieChart,
  UserCheck,
  Shield,
  FileCheck2,
  CalendarCheck
} from 'lucide-react';

const showcaseTabs = [
  {
    id: 'tracking',
    label: 'Live Tracking',
    icon: Navigation,
    badge: 'Sub-Second Sockets',
    title: 'Real-Time Geographic Workforce Visibility',
    description: 'Continuous low-latency GPS telemetry streaming with automatic speed jump filtering and high-precision status tracking.'
  },
  {
    id: 'dispatch',
    label: 'Dispatch Board',
    icon: ClipboardList,
    badge: 'Proximity Aware',
    title: 'Intelligent Field Task Dispatch & Workflows',
    description: 'Structured task allocation based on physical proximity, status tracking from assignment to photo proof-of-work verification.'
  },
  {
    id: 'attendance',
    label: 'Attendance & Geofencing',
    icon: CalendarCheck,
    badge: 'Deterministic Polygon',
    title: 'Automated Geofence Attendance & Visit Logging',
    description: 'Point-in-polygon mathematical verification for office shifts and customer site visits with zero manual check-in friction.'
  },
  {
    id: 'analytics',
    label: 'Operations Intelligence',
    icon: BrainCircuit,
    badge: 'Telemetry & AI',
    title: 'Deterministic Telemetry & Automated AI Shift Reports',
    description: 'Aggregate Haversine travel distances, active visit durations, and generate instant executive summaries of field operations.'
  }
];

export default function ProductShowcaseSection() {
  const [activeTab, setActiveTab] = useState('tracking');

  return (
    <section className="py-24 bg-surface border-y border-border relative overflow-hidden">
      {/* Background soft ambient accents */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/5 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-info/5 blur-3xl rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="primary" className="mb-3 uppercase tracking-wider text-xs">
            Product Deep-Dive
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
            Engineered for Mission-Critical Field Operations.
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Explore the core architectural modules powering OpsGrid's unified field management system.
          </p>
        </div>

        {/* Tab Selector Buttons */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-12 max-w-4xl mx-auto">
          {showcaseTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all duration-200 border ${
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-background hover:bg-surface-muted text-muted-foreground hover:text-foreground border-border'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active Tab Preview Display */}
        <div className="max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'tracking' && (
              <motion.div
                key="tracking"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="rounded-2xl border border-border bg-background p-6 md:p-8 shadow-lg"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border mb-6">
                  <div>
                    <div className="flex items-center gap-2.5 mb-1">
                      <h3 className="text-xl font-bold text-foreground">Live Geographic Telemetry</h3>
                      <Badge variant="success" className="text-[11px]">Real-Time Active</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Sub-second Socket.IO bidirectional coordinates streaming</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-surface px-3 py-1.5 rounded-lg border border-border">
                    <Signal className="w-3.5 h-3.5 text-success" />
                    <span>GPS Engine: Active</span>
                  </div>
                </div>

                {/* Tracking Preview Structural Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Worker List */}
                  <div className="space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Field Personnel</div>
                    
                    <div className="p-3.5 rounded-xl border border-primary/40 bg-surface shadow-sm">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-success" />
                          <span className="text-xs font-bold text-foreground">Ramesh Kumar</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Battery className="w-3 h-3 text-success" /> 88%
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-primary" /> Inside "Vizag Zone"
                      </div>
                      <div className="mt-2 text-[11px] text-muted-foreground bg-surface-muted px-2 py-1 rounded">
                        Moving · 24 km/h · ±12m accuracy
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-border bg-surface">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-success" />
                          <span className="text-xs font-bold text-foreground">Priya Sharma</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Battery className="w-3 h-3 text-success" /> 92%
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-success" /> At "Main Office Depot"
                      </div>
                      <div className="mt-2 text-[11px] text-muted-foreground bg-surface-muted px-2 py-1 rounded">
                        Stationary · Check-In Verified
                      </div>
                    </div>
                  </div>

                  {/* Right Map Canvas Simulation */}
                  <div className="lg:col-span-2 rounded-xl border border-border bg-slate-950 p-4 relative min-h-[260px] flex flex-col justify-between overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
                    
                    {/* Top Status Bar */}
                    <div className="relative z-10 flex items-center justify-between text-xs text-slate-300">
                      <div className="flex items-center gap-2">
                        <Navigation className="w-3.5 h-3.5 text-sky-400" />
                        <span className="font-semibold">Leaflet GIS Engine</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">Turf.js Geofencing</span>
                    </div>

                    {/* Mid Zone Graphics */}
                    <div className="relative z-10 my-6 flex items-center justify-around">
                      <div className="p-3 rounded-xl border border-sky-500/40 bg-sky-500/10 text-center backdrop-blur-sm">
                        <div className="text-xs font-bold text-sky-300">Polygon: Vizag Site</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Customer Geofence · Active</div>
                      </div>
                      <div className="h-0.5 w-16 border-t-2 border-dashed border-sky-400/50" />
                      <div className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-center backdrop-blur-sm">
                        <div className="text-xs font-bold text-emerald-300">Polygon: Main Depot</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Office Geofence · Verified</div>
                      </div>
                    </div>

                    {/* Bottom Telemetry Footer */}
                    <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                      <span>Speed Jump Guard: &lt; 150 km/h</span>
                      <span>GPS Ping Frequency: 10s</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'dispatch' && (
              <motion.div
                key="dispatch"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="rounded-2xl border border-border bg-background p-6 md:p-8 shadow-lg"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border mb-6">
                  <div>
                    <div className="flex items-center gap-2.5 mb-1">
                      <h3 className="text-xl font-bold text-foreground">Proximity Dispatch Board</h3>
                      <Badge variant="info" className="text-[11px]">Workflow Pipeline</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Assign tasks to the nearest available worker and monitor lifecycle progress</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-surface px-3 py-1.5 rounded-lg border border-border">
                    <ClipboardList className="w-3.5 h-3.5 text-primary" />
                    <span>Auto-Proximity Matching</span>
                  </div>
                </div>

                {/* Kanban / Queue Preview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Column 1: Pending */}
                  <div className="p-3 rounded-xl bg-surface border border-border">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-border text-xs font-bold text-muted-foreground">
                      <span>Pending Allocation</span>
                      <Badge variant="outline" className="text-[10px]">Queue</Badge>
                    </div>
                    <div className="p-3 rounded-lg bg-surface-muted/60 border border-border/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">HVAC Unit Inspection</span>
                        <Badge variant="destructive" className="text-[9px]">High</Badge>
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Gachibowli Tech Zone
                      </div>
                      <div className="text-[10px] text-primary font-medium">Nearest: Priya S. (1.4 km)</div>
                    </div>
                  </div>

                  {/* Column 2: In Progress */}
                  <div className="p-3 rounded-xl bg-surface border border-border">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-border text-xs font-bold text-muted-foreground">
                      <span>Active Execution</span>
                      <Badge variant="warning" className="text-[10px]">In Field</Badge>
                    </div>
                    <div className="p-3 rounded-lg bg-surface-muted/60 border border-border/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">Electrical Relay Setup</span>
                        <Badge variant="warning" className="text-[9px]">Medium</Badge>
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-primary" /> Ramesh Kumar
                      </div>
                      <div className="text-[10px] text-amber-500 font-medium">Status: In Progress</div>
                    </div>
                  </div>

                  {/* Column 3: Completed & Verified */}
                  <div className="p-3 rounded-xl bg-surface border border-border">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-border text-xs font-bold text-muted-foreground">
                      <span>Verified Completed</span>
                      <Badge variant="success" className="text-[10px]">Proof Verified</Badge>
                    </div>
                    <div className="p-3 rounded-lg bg-surface-muted/60 border border-border/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">Substation Sensor Check</span>
                        <Badge variant="success" className="text-[9px]">Completed</Badge>
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <FileCheck2 className="w-3 h-3 text-success" /> Proof Image Attached
                      </div>
                      <div className="text-[10px] text-emerald-500 font-medium">Verified by Dispatcher</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'attendance' && (
              <motion.div
                key="attendance"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="rounded-2xl border border-border bg-background p-6 md:p-8 shadow-lg"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border mb-6">
                  <div>
                    <div className="flex items-center gap-2.5 mb-1">
                      <h3 className="text-xl font-bold text-foreground">Deterministic Attendance & Geofencing</h3>
                      <Badge variant="success" className="text-[11px]">Zero-Touch</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Point-in-polygon verification ensures attendance and visit logs are physically validated</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-surface px-3 py-1.5 rounded-lg border border-border">
                    <Shield className="w-3.5 h-3.5 text-success" />
                    <span>Cryptographic Verification</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Shift Attendance Flow */}
                  <div className="p-4 rounded-xl bg-surface border border-border space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-border">
                      <span className="text-xs font-bold text-foreground">Shift Verification Rule</span>
                      <Badge variant="info" className="text-[10px]">Morning Shift (09:00 - 18:00)</Badge>
                    </div>
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center justify-between p-2 rounded bg-surface-muted">
                        <span>Office Geofence Entry</span>
                        <span className="font-semibold text-foreground">09:14 AM (On Time)</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-surface-muted">
                        <span>Grace Period Config</span>
                        <span className="font-semibold text-foreground">15 Minutes</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-surface-muted">
                        <span>Physical GPS Validation</span>
                        <span className="font-semibold text-success flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Inside Office Zone
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Visit Lifecycle */}
                  <div className="p-4 rounded-xl bg-surface border border-border space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-border">
                      <span className="text-xs font-bold text-foreground">Customer Site Visit Engine</span>
                      <Badge variant="primary" className="text-[10px]">Automated Lifecycle</Badge>
                    </div>
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center justify-between p-2 rounded bg-surface-muted">
                        <span>Customer Site Entry</span>
                        <span className="font-semibold text-foreground">Auto-Created CustomerVisit</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-surface-muted">
                        <span>Customer Site Exit</span>
                        <span className="font-semibold text-foreground">Departure & Duration Logged</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-surface-muted">
                        <span>Stale Recovery Guard</span>
                        <span className="font-semibold text-primary">Self-Healing Lifecycle</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="rounded-2xl border border-border bg-background p-6 md:p-8 shadow-lg"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border mb-6">
                  <div>
                    <div className="flex items-center gap-2.5 mb-1">
                      <h3 className="text-xl font-bold text-foreground">Operations Intelligence & AI Synthesis</h3>
                      <Badge variant="primary" className="text-[11px]">Llama 3 / Gemini</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Algorithmic distance summaries combined with natural language operational insights</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-surface px-3 py-1.5 rounded-lg border border-border">
                    <BrainCircuit className="w-3.5 h-3.5 text-primary" />
                    <span>Automated Reporting</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Distance Engine */}
                  <div className="p-4 rounded-xl bg-surface border border-border space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-border">
                      <span className="text-xs font-bold text-foreground">Haversine Distance Engine</span>
                      <Badge variant="outline" className="text-[10px]">Filter & Trajectory</Badge>
                    </div>
                    <div className="p-3 rounded-lg bg-surface-muted space-y-2 text-xs">
                      <div className="text-muted-foreground">Continuous spatial distance calculations filter out stationary noise and jitter:</div>
                      <ul className="space-y-1 text-foreground font-mono text-[11px]">
                        <li>• Stationary rejection: &lt; 5 meters</li>
                        <li>• Maximum speed limit: 150 km/h</li>
                        <li>• Accurate mileage tracking for reimbursement</li>
                      </ul>
                    </div>
                  </div>

                  {/* AI Summary Card Preview */}
                  <div className="p-4 rounded-xl bg-surface border border-border space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-border">
                      <span className="text-xs font-bold text-foreground">AI Shift Digest Output</span>
                      <Badge variant="info" className="text-[10px]">Generated</Badge>
                    </div>
                    <div className="p-3 rounded-lg bg-surface-muted/80 text-xs text-muted-foreground leading-relaxed border border-border/50">
                      <p className="font-semibold text-foreground mb-1">Operational Shift Digest:</p>
                      <p className="text-[11px]">"All scheduled team members verified on-site within grace periods. Field tasks across northern sectors executed on schedule with verified proof attachments. Zero unauthorized perimeter deviations recorded."</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
}
