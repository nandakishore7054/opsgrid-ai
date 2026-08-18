import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '../../common/components/ui/Button';
import { Badge } from '../../common/components/ui/Badge';
import { 
  Navigation, 
  MapPin, 
  ShieldCheck, 
  Radio, 
  Layers, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  Activity,
  Compass,
  Cpu
} from 'lucide-react';

export default function HeroSection({ isAuthenticated, dashboardLink = '/admin/dashboard' }) {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden px-6">
      {/* Background Gradients & Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] md:w-[900px] h-[450px] bg-primary/15 blur-[130px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-info/10 blur-[100px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto">
        {/* Top Header & Copy */}
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface border border-border shadow-sm mb-6"
          >
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-semibold text-foreground tracking-wide">
              Enterprise Field Operations & Telemetry Platform
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.12] mb-6"
          >
            Real-Time Field Operations.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-sky-500 to-info">
              Deterministic Intelligence.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed max-w-3xl"
          >
            OpsGrid unifies real-time GPS tracking, polygon geofencing, proximity-based task dispatching, and automated attendance verification into a single, high-performance command center.
          </motion.p>

          {/* Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto justify-center mb-12"
          >
            {!isAuthenticated ? (
              <>
                <Button as={Link} to="/register" size="lg" className="w-full sm:w-auto text-base h-12 px-8 shadow-sm">
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button as="a" href="#showcase" variant="outline" size="lg" className="w-full sm:w-auto text-base h-12 px-8 bg-surface/80 backdrop-blur-sm">
                  Explore Platform
                </Button>
              </>
            ) : (
              <Button as={Link} to={dashboardLink} size="lg" className="w-full sm:w-auto text-base h-12 px-8 shadow-sm">
                <span>Go to Command Center</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </motion.div>

          {/* Architectural Pillars / Enterprise Guarantees (No fake logos) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl text-left"
          >
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-surface/50 border border-border/80 text-xs font-medium text-muted-foreground">
              <Radio className="w-4 h-4 text-primary shrink-0" />
              <span>Sub-Second Socket Streams</span>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-surface/50 border border-border/80 text-xs font-medium text-muted-foreground">
              <Layers className="w-4 h-4 text-primary shrink-0" />
              <span>Polygon Geofence Engine</span>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-surface/50 border border-border/80 text-xs font-medium text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
              <span>Role-Based Access Control</span>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-surface/50 border border-border/80 text-xs font-medium text-muted-foreground">
              <Cpu className="w-4 h-4 text-primary shrink-0" />
              <span>Automated Shift Synthesis</span>
            </div>
          </motion.div>
        </div>

        {/* High-Fidelity Interactive Command Center Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45, ease: "easeOut" }}
          className="relative max-w-6xl mx-auto rounded-2xl border border-border bg-surface/95 shadow-2xl overflow-hidden backdrop-blur-md"
        >
          {/* Window Chrome / Titlebar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-muted/60 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive/80" />
              <div className="w-3 h-3 rounded-full bg-warning/80" />
              <div className="w-3 h-3 rounded-full bg-success/80" />
              <span className="ml-3 font-semibold text-muted-foreground flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-primary" />
                OpsGrid Command Center · Operations Overview
              </span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-success/15 text-success text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                Live Telemetry Active
              </span>
            </div>
          </div>

          {/* Mockup Dashboard Content Grid */}
          <div className="p-5 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 bg-background/50">
            {/* Left Col: Live Map View Mockup (7 cols) */}
            <div className="lg:col-span-7 flex flex-col rounded-xl border border-border bg-surface overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-surface-muted/30">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-foreground">Live Geographic Map</span>
                </div>
                <Badge variant="info" className="text-[10px] py-0 px-2">Polygon Geofences Active</Badge>
              </div>

              {/* Map Canvas Representation */}
              <div className="relative h-64 md:h-80 w-full bg-slate-900 overflow-hidden flex items-center justify-center">
                {/* SVG Map Grid Background */}
                <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:20px_20px]" />
                
                {/* Geofence Polygons */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {/* Customer Geofence 1 */}
                  <polygon 
                    points="60,40 180,30 200,120 70,110" 
                    fill="rgba(14, 165, 233, 0.12)" 
                    stroke="rgba(14, 165, 233, 0.6)" 
                    strokeWidth="1.5" 
                    strokeDasharray="4 2"
                  />
                  {/* Office Geofence */}
                  <polygon 
                    points="260,130 380,110 400,230 250,210" 
                    fill="rgba(16, 185, 129, 0.12)" 
                    stroke="rgba(16, 185, 129, 0.6)" 
                    strokeWidth="1.5" 
                  />
                  {/* Worker Route Trail */}
                  <path 
                    d="M 120,75 Q 190,140 310,160" 
                    fill="none" 
                    stroke="rgba(56, 189, 248, 0.7)" 
                    strokeWidth="2" 
                    strokeDasharray="5 3" 
                  />
                </svg>

                {/* Worker Pin 1 */}
                <div className="absolute top-[28%] left-[22%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  <div className="relative flex items-center justify-center">
                    <span className="absolute w-8 h-8 rounded-full bg-primary/30 animate-ping" />
                    <div className="w-7 h-7 rounded-full bg-primary border-2 border-white shadow-md flex items-center justify-center text-white text-[11px] font-bold">
                      RK
                    </div>
                  </div>
                  <div className="mt-1 px-2 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-white text-[10px] font-medium shadow-sm whitespace-nowrap">
                    Ramesh K. · <span className="text-sky-400">At Customer Site</span>
                  </div>
                </div>

                {/* Worker Pin 2 */}
                <div className="absolute top-[58%] left-[62%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-success border-2 border-white shadow-md flex items-center justify-center text-white text-[11px] font-bold">
                    PS
                  </div>
                  <div className="mt-1 px-2 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-white text-[10px] font-medium shadow-sm whitespace-nowrap">
                    Priya S. · <span className="text-emerald-400">Main Depot (Checked In)</span>
                  </div>
                </div>

                {/* Map Control Floating Widget */}
                <div className="absolute bottom-3 left-3 p-2 rounded-lg bg-slate-900/90 border border-slate-700/80 text-white text-[11px] flex items-center gap-3 backdrop-blur-md">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-success" />
                    <span>2 Online</span>
                  </div>
                  <div className="h-3 w-px bg-slate-700" />
                  <div className="text-slate-300">
                    Accuracy: <span className="text-sky-400 font-semibold">High (±12m)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: Dispatch Queue & Telemetry Stream (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {/* Dispatch Feed Card */}
              <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-primary" />
                    Active Dispatch Queue
                  </span>
                  <Badge variant="outline" className="text-[10px]">Priority Sorting</Badge>
                </div>
                
                <div className="space-y-2.5">
                  <div className="p-2.5 rounded-lg bg-surface-muted/50 border border-border/60 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-foreground">Substation Maintenance #TK-082</div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-primary" /> Vizag North Sector · Assigned to Ramesh K.
                      </div>
                    </div>
                    <Badge variant="warning" className="text-[10px]">In Progress</Badge>
                  </div>

                  <div className="p-2.5 rounded-lg bg-surface-muted/50 border border-border/60 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-foreground">Fiber Line Inspection #TK-083</div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-primary" /> Gachibowli Hub · Proximity Match
                      </div>
                    </div>
                    <Badge variant="info" className="text-[10px]">Assigned</Badge>
                  </div>
                </div>
              </div>

              {/* Attendance & Verification Card */}
              <div className="rounded-xl border border-border bg-surface p-4 shadow-sm flex-1">
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-border">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    Geofenced Shift Verification
                  </span>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Today
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-2.5 rounded-lg bg-surface-muted/60 border border-border/50">
                    <div className="text-[11px] text-muted-foreground font-medium">Auto Check-In</div>
                    <div className="text-sm font-bold text-foreground mt-0.5">100% Geofenced</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface-muted/60 border border-border/50">
                    <div className="text-[11px] text-muted-foreground font-medium">Customer Visits</div>
                    <div className="text-sm font-bold text-primary mt-0.5">Automated Logs</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
