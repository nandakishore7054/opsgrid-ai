import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { Logo } from '../../common/components/branding/Logo';

export default function Footer() {
  return (
    <footer className="bg-surface border-t border-border pt-16 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-10 mb-14">
          
          {/* Brand Col */}
          <div className="md:col-span-2 lg:col-span-2 space-y-4">
            <Logo to="/" size="md" wordmarkClassName="text-xl" />
            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
              Enterprise Field Operations & Telemetry Intelligence Platform. Real-time GPS tracking, polygon geofencing, proximity-based task dispatching, and automated shift verification.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
              <span>Enterprise Role-Based Access Architecture</span>
            </div>
          </div>
          
          {/* Platform Navigation */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-foreground mb-4">Platform</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><a href="#showcase" className="hover:text-primary transition-colors">Product Showcase</a></li>
              <li><a href="#features" className="hover:text-primary transition-colors">Core Features</a></li>
              <li><a href="#benefits" className="hover:text-primary transition-colors">Operational Value</a></li>
              <li><a href="#why" className="hover:text-primary transition-colors">Why OpsGrid</a></li>
            </ul>
          </div>
          
          {/* Workspaces Navigation */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-foreground mb-4">Workspaces</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/login" className="hover:text-primary transition-colors">Admin Command Center</Link></li>
              <li><Link to="/login" className="hover:text-primary transition-colors">Dispatcher Board</Link></li>
              <li><Link to="/login" className="hover:text-primary transition-colors">Technician Field App</Link></li>
              <li><Link to="/register" className="hover:text-primary transition-colors">Provision Organization</Link></li>
            </ul>
          </div>

          {/* Technology & Security */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-foreground mb-4">Architecture</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><span className="hover:text-foreground transition-colors cursor-default">WebSocket Streams</span></li>
              <li><span className="hover:text-foreground transition-colors cursor-default">2dsphere Geospatial</span></li>
              <li><span className="hover:text-foreground transition-colors cursor-default">Haversine Distance</span></li>
              <li><span className="hover:text-foreground transition-colors cursor-default">JWT Cryptography</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} OpsGrid Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="cursor-default">Privacy Policy</span>
            <span className="cursor-default">Terms of Service</span>
            <span className="cursor-default">System Status: Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
