import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../app/auth-context';
import { ArrowRight, ShieldCheck, Radio, CheckCircle2 } from 'lucide-react';
import { Button } from '../common/components/ui/Button';
import ThemeSwitcher from '../common/components/layout/ThemeSwitcher';
import { Logo } from '../common/components/branding/Logo';

import HeroSection from './landing/HeroSection';
import ProductShowcaseSection from './landing/ProductShowcaseSection';
import FeaturesSection from './landing/FeaturesSection';
import BenefitsSection from './landing/BenefitsSection';
import WhyFieldIntelSection from './landing/WhyFieldIntelSection';
import TechStackSection from './landing/TechStackSection';
import Footer from './landing/Footer';

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm font-medium text-muted-foreground">Loading workspace...</p>
        </div>
      </main>
    );
  }

  let dashboardLink = '/admin/dashboard';
  if (user?.role === 'worker') dashboardLink = '/worker/dashboard';
  if (user?.role === 'dispatcher') dashboardLink = '/admin/dispatch-board';

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300 overflow-x-hidden selection:bg-primary/20">
      
      {/* Fixed Navigation Bar */}
      <header className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-3.5 border-b border-border/70 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3">
          <Logo to="/" size="md" />
        </div>
        
        {/* Navigation Anchors */}
        <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <a href="#showcase" className="hover:text-foreground transition-colors">Showcase</a>
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#benefits" className="hover:text-foreground transition-colors">Benefits</a>
          <a href="#why" className="hover:text-foreground transition-colors">Why OpsGrid</a>
        </nav>

        {/* Right CTA / Theme */}
        <div className="flex items-center gap-3">
          <ThemeSwitcher />

          {isAuthenticated ? (
            <Link to={dashboardLink}>
              <Button size="sm" className="font-bold gap-1.5 shadow-xs">
                <span>Go to Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm" className="font-semibold text-xs">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="font-bold text-xs gap-1.5 shadow-xs">
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pt-16">
        <HeroSection isAuthenticated={isAuthenticated} dashboardLink={dashboardLink} />
        <div id="showcase">
          <ProductShowcaseSection />
        </div>
        <div id="features">
          <FeaturesSection />
        </div>
        <div id="benefits">
          <BenefitsSection />
        </div>
        <div id="why">
          <WhyFieldIntelSection />
        </div>
        <TechStackSection />
      </main>

      {/* Footer */}
      <Footer />

    </div>
  );
}