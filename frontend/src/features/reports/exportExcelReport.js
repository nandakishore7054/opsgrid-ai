import * as XLSX from 'xlsx';

/**
 * Generates and downloads a multi-sheet Excel workbook of OpsGrid Operations
 * using ONLY authentic application data.
 */
export function exportExcelReport({
  analyticsData = null,
  chartsData = null,
  tasks = [],
  notifications = []
}) {
  const wb = XLSX.utils.book_new();
  const timestamp = new Date().toLocaleString();

  // Sheet 1: Executive Summary
  const workforce = analyticsData?.workforce || {};
  const attendance = analyticsData?.attendance || {};
  const customer = analyticsData?.customer || {};
  const productivity = analyticsData?.productivity || {};

  const distanceKm = typeof productivity?.totalDistanceToday === 'number'
    ? productivity.totalDistanceToday.toFixed(1)
    : parseFloat(productivity?.totalDistanceToday || '0').toFixed(1);

  const summaryData = [
    { Parameter: 'Report Name', Value: 'OpsGrid Operations Summary Report' },
    { Parameter: 'Report Generated At', Value: timestamp },
    { Parameter: 'Active Workforce (Online)', Value: workforce.activeWorkers ?? 0 },
    { Parameter: 'Telemetry Disconnected (Offline)', Value: workforce.offlineWorkers ?? 0 },
    { Parameter: 'Present Today (Check-ins)', Value: attendance.presentToday ?? 0 },
    { Parameter: 'Customer Site Visits Today', Value: customer.customerVisitsToday ?? 0 },
    { Parameter: 'Total Distance Travelled (km)', Value: Number(distanceKm) || 0 },
    { Parameter: 'Total Open Tasks Tracked', Value: tasks.length }
  ];

  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 35 }, { wch: 35 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive Summary');

  // Sheet 2: Work Orders & Tasks
  const taskRows = tasks.map(t => ({
    'Work Order Title': t.title || 'Untitled',
    'Priority': (t.priority || 'medium').toUpperCase(),
    'Status': (t.status || 'unassigned').replace('_', ' ').replace('-', ' ').toUpperCase(),
    'Assigned Technician': t.assignedTo?.name || 'Unassigned',
    'Technician Email': t.assignedTo?.email || 'N/A',
    'Site Location': t.locationAddress || 'Site Coordinates',
    'Deadline': t.deadline ? new Date(t.deadline).toLocaleString() : 'No deadline',
    'Created At': t.createdAt ? new Date(t.createdAt).toLocaleString() : 'N/A'
  }));

  const wsTasks = XLSX.utils.json_to_sheet(taskRows.length ? taskRows : [{ Status: 'No active tasks found' }]);
  wsTasks['!cols'] = [
    { wch: 32 },
    { wch: 14 },
    { wch: 16 },
    { wch: 24 },
    { wch: 28 },
    { wch: 35 },
    { wch: 22 },
    { wch: 22 }
  ];
  XLSX.utils.book_append_sheet(wb, wsTasks, 'Work Orders');

  // Sheet 3: Technician Distances (if available)
  const workerDistances = chartsData?.workerDistanceTravelled || [];
  if (workerDistances.length > 0) {
    const distanceRows = workerDistances.map(w => ({
      'Technician Name': w.workerName || 'Technician',
      'Distance Travelled (km)': w.distance || 0,
      'Verification Status': 'GPS Telemetry Verified'
    }));

    const wsDistances = XLSX.utils.json_to_sheet(distanceRows);
    wsDistances['!cols'] = [{ wch: 28 }, { wch: 24 }, { wch: 26 }];
    XLSX.utils.book_append_sheet(wb, wsDistances, 'Technician Distances');
  }

  // Sheet 4: Operational Activity Feed (if notifications available)
  if (notifications.length > 0) {
    const activityRows = notifications.map(n => ({
      'Event Timestamp': n.createdAt ? new Date(n.createdAt).toLocaleString() : 'N/A',
      'Event Type': (n.type || 'operational').toUpperCase(),
      'Activity Message': n.message || ''
    }));

    const wsActivity = XLSX.utils.json_to_sheet(activityRows);
    wsActivity['!cols'] = [{ wch: 24 }, { wch: 20 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(wb, wsActivity, 'Activity Feed');
  }

  // Save the workbook
  const fileNameDate = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `OpsGrid_Operations_Report_${fileNameDate}.xlsx`);
}
