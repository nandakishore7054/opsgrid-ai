import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  ChevronDown, 
  Activity,
  CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../app/api';
import { Button } from '../../common/components/ui/Button';
import { exportPdfReport } from './exportPdfReport';
import { exportExcelReport } from './exportExcelReport';

export default function ReportExportMenu({
  analyticsData = null,
  chartsData = null,
  tasks = null,
  notifications = null,
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState(null); // 'pdf' | 'excel' | null
  const menuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Helper to fetch any missing data required for the comprehensive report
  const resolveCompleteReportData = async () => {
    let resolvedAnalytics = analyticsData;
    let resolvedCharts = chartsData;
    let resolvedTasks = tasks;
    let resolvedNotifications = notifications;

    const fetchPromises = [];

    if (!resolvedAnalytics) {
      fetchPromises.push(
        api.get('/dashboard/analytics').then(res => {
          resolvedAnalytics = res.data?.data;
        }).catch(() => {})
      );
    }

    if (!resolvedCharts) {
      fetchPromises.push(
        api.get('/dashboard/charts').then(res => {
          resolvedCharts = res.data?.data;
        }).catch(() => {})
      );
    }

    if (!resolvedTasks) {
      fetchPromises.push(
        api.get('/tasks', { params: { limit: 100 } }).then(res => {
          resolvedTasks = res.data?.data?.tasks || [];
        }).catch(() => {
          resolvedTasks = [];
        })
      );
    }

    if (!resolvedNotifications) {
      fetchPromises.push(
        api.get('/notifications').then(res => {
          resolvedNotifications = res.data?.data?.notifications || [];
        }).catch(() => {
          resolvedNotifications = [];
        })
      );
    }

    if (fetchPromises.length > 0) {
      await Promise.allSettled(fetchPromises);
    }

    return {
      analyticsData: resolvedAnalytics,
      chartsData: resolvedCharts,
      tasks: resolvedTasks || [],
      notifications: resolvedNotifications || []
    };
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    setExportType('pdf');
    setIsOpen(false);

    try {
      const data = await resolveCompleteReportData();
      await exportPdfReport(data);
      toast.success('OpsGrid Operations PDF Report generated.');
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error('Failed to generate PDF report.');
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    setExportType('excel');
    setIsOpen(false);

    try {
      const data = await resolveCompleteReportData();
      exportExcelReport(data);
      toast.success('OpsGrid Excel Workbook exported.');
    } catch (err) {
      console.error('Excel export error:', err);
      toast.error('Failed to export Excel report.');
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={menuRef}>
      <Button
        variant="outline"
        size="sm"
        disabled={isExporting}
        onClick={() => setIsOpen(prev => !prev)}
        className="gap-2 shadow-xs bg-surface text-xs font-semibold h-8.5 hover:border-primary/50"
      >
        {isExporting ? (
          <>
            <Activity className="w-3.5 h-3.5 animate-spin text-primary" />
            <span>Generating {exportType === 'pdf' ? 'PDF...' : 'Excel...'}</span>
          </>
        ) : (
          <>
            <Download className="w-3.5 h-3.5 text-primary" />
            <span>Export Report</span>
            <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-50 mt-2 w-64 rounded-2xl border border-border/70 bg-surface/95 p-1.5 shadow-xl backdrop-blur-md focus:outline-none"
          >
            <div className="px-3 py-2 border-b border-border/60 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                Operations Reporting
              </span>
              <p className="text-xs font-semibold text-foreground mt-0.5">
                Download Live Telemetry & Tasks
              </p>
            </div>

            <div className="space-y-1">
              {/* PDF Option */}
              <button
                type="button"
                onClick={handleExportPdf}
                className="w-full flex items-start gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-surface-muted/60 group"
              >
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0 border border-rose-500/20 group-hover:bg-rose-500/20 transition-colors">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-foreground">Export PDF Report</div>
                  <div className="text-[11px] text-muted-foreground leading-snug">
                    Executive summary with KPIs, alerts & work orders
                  </div>
                </div>
              </button>

              {/* Excel Option */}
              <button
                type="button"
                onClick={handleExportExcel}
                className="w-full flex items-start gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-surface-muted/60 group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-foreground">Export Excel Report</div>
                  <div className="text-[11px] text-muted-foreground leading-snug">
                    Multi-sheet workbook with raw tasks & distance data
                  </div>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
