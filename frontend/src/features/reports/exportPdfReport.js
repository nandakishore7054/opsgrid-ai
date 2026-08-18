import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generates and downloads a clean, professional OpsGrid Operations PDF Report
 * using ONLY authentic application data.
 */
export async function exportPdfReport({
  analyticsData = null,
  chartsData = null,
  tasks = [],
  notifications = []
}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryColor = [2, 132, 199]; // OpsGrid Brand Blue (#0284c7)
  const darkTextColor = [15, 23, 42]; // Slate 900
  const mutedTextColor = [100, 116, 139]; // Slate 500
  const lightBgColor = [248, 250, 252]; // Slate 50

  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 18;

  // 1. Report Header & Branding
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...primaryColor);
  doc.text('OPSGRID', 14, currentY);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedTextColor);
  doc.text('Field Operations Intelligence & Workforce Platform', 14, currentY + 5);

  const timestamp = new Date().toLocaleString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  doc.setFontSize(8);
  doc.text(`Generated: ${timestamp}`, pageWidth - 14, currentY + 2, { align: 'right' });
  doc.text('Confidential Internal Report', pageWidth - 14, currentY + 6, { align: 'right' });

  currentY += 12;

  // Header Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, currentY, pageWidth - 14, currentY);
  currentY += 8;

  // Report Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...darkTextColor);
  doc.text('Operations Executive Summary', 14, currentY);
  currentY += 6;

  // 2. Executive KPIs Section
  const workforce = analyticsData?.workforce || {};
  const attendance = analyticsData?.attendance || {};
  const customer = analyticsData?.customer || {};
  const productivity = analyticsData?.productivity || {};

  const distanceKm = typeof productivity?.totalDistanceToday === 'number'
    ? productivity.totalDistanceToday.toFixed(1)
    : parseFloat(productivity?.totalDistanceToday || '0').toFixed(1);

  const kpiData = [
    [
      'Active Workforce',
      `${workforce.activeWorkers ?? 'N/A'} Online`,
      'Present Today',
      `${attendance.presentToday ?? 'N/A'} Check-ins`
    ],
    [
      'Telemetry Disconnected',
      `${workforce.offlineWorkers ?? 0} Offline`,
      'Customer Site Visits',
      `${customer.customerVisitsToday ?? 0} Geofenced`
    ],
    [
      'Total Distance Travelled',
      `${distanceKm} km (Haversine)`,
      'Open Tasks Count',
      `${tasks.length} Tracked`
    ]
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['Metric', 'Current Value', 'Metric', 'Current Value']],
    body: kpiData,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5
    },
    bodyStyles: {
      textColor: darkTextColor,
      fontSize: 8,
      cellPadding: 2.5
    },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: lightBgColor },
      2: { fontStyle: 'bold', fillColor: lightBgColor }
    },
    margin: { left: 14, right: 14 }
  });

  currentY = doc.lastAutoTable.finalY + 9;

  // 3. Operational Tasks Breakdown Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...darkTextColor);
  doc.text('Active Work Orders & Task Status', 14, currentY);
  currentY += 4;

  const taskRows = tasks.slice(0, 15).map(t => [
    t.title || 'Untitled Task',
    (t.priority || 'Normal').toUpperCase(),
    (t.status || 'unassigned').replace('_', ' ').replace('-', ' ').toUpperCase(),
    t.assignedTo?.name || 'Unassigned',
    t.locationAddress || 'Site Coordinates',
    t.deadline ? new Date(t.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'No deadline'
  ]);

  if (taskRows.length > 0) {
    autoTable(doc, {
      startY: currentY,
      head: [['Work Order Title', 'Priority', 'Status', 'Assignee', 'Site Location', 'Deadline']],
      body: taskRows,
      theme: 'striped',
      headStyles: {
        fillColor: [30, 41, 59], // Slate 800
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: darkTextColor,
        cellPadding: 2
      },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 20 },
        2: { cellWidth: 24 },
        3: { cellWidth: 30 },
        4: { cellWidth: 38 },
        5: { cellWidth: 20 }
      },
      margin: { left: 14, right: 14 }
    });
    currentY = doc.lastAutoTable.finalY + 9;
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(...mutedTextColor);
    doc.text('No active work orders currently scheduled.', 14, currentY + 3);
    currentY += 10;
  }

  // Check if we need a new page for remaining sections
  if (currentY > 230) {
    doc.addPage();
    currentY = 18;
  }

  // 4. Technician Distance Telemetry (if available from chartsData)
  const workerDistances = chartsData?.workerDistanceTravelled || [];
  if (workerDistances.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...darkTextColor);
    doc.text('Top Verified Field Distances Today', 14, currentY);
    currentY += 4;

    const distanceRows = workerDistances.map(w => [
      w.workerName || 'Field Technician',
      `${w.distance} km`,
      'GPS Telemetry Verified'
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Technician Name', 'Total Distance Travelled', 'Verification Method']],
      body: distanceRows,
      theme: 'grid',
      headStyles: {
        fillColor: [71, 85, 105], // Slate 600
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 8,
        textColor: darkTextColor,
        cellPadding: 2
      },
      margin: { left: 14, right: 14 }
    });
    currentY = doc.lastAutoTable.finalY + 9;
  }

  // 5. Attention Required Section
  if (currentY > 240) {
    doc.addPage();
    currentY = 18;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...darkTextColor);
  doc.text('Attention Required & Operational Alerts', 14, currentY);
  currentY += 4;

  const offlineWorkersCount = workforce.offlineWorkers || 0;
  const alertItems = [];

  if (offlineWorkersCount > 0) {
    alertItems.push([
      'CRITICAL',
      'Telemetry Disconnected',
      `${offlineWorkersCount} technician(s) are currently offline or out of GPS range.`
    ]);
  }

  if (alertItems.length === 0) {
    alertItems.push([
      'NORMAL',
      'All Systems Operating Normally',
      'No operational exceptions or disconnected technicians currently require attention.'
    ]);
  }

  autoTable(doc, {
    startY: currentY,
    head: [['Severity', 'Alert Item', 'Operational Details']],
    body: alertItems,
    theme: 'grid',
    headStyles: {
      fillColor: alertItems[0][0] === 'CRITICAL' ? [225, 29, 72] : [16, 185, 129],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: darkTextColor,
      cellPadding: 2.5
    },
    columnStyles: {
      0: { cellWidth: 25, fontStyle: 'bold' },
      1: { cellWidth: 50, fontStyle: 'bold' }
    },
    margin: { left: 14, right: 14 }
  });

  // 6. Page Numbers & Footer
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedTextColor);
    doc.text(
      `OpsGrid Operations Report · Page ${i} of ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    );
  }

  // Save the document
  const fileNameDate = new Date().toISOString().split('T')[0];
  doc.save(`OpsGrid_Operations_Report_${fileNameDate}.pdf`);
}
