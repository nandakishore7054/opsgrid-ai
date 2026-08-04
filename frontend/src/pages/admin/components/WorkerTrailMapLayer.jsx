import React, { useEffect, useRef } from 'react';
import { Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Custom Map Pin Icons using Leaflet divIcon
const createLabeledIcon = (label, bgColor) => L.divIcon({
  className: 'custom-labeled-marker',
  html: `<div style="
    background-color: ${bgColor}; 
    color: white; 
    font-weight: bold; 
    font-size: 10px; 
    padding: 2px 6px; 
    border-radius: 4px; 
    border: 2px solid white; 
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    white-space: nowrap;
    position: relative;
    top: -10px;
    left: -50%;
  ">${label}</div>`,
  iconSize: [0, 0],
  iconAnchor: [0, 0],
  popupAnchor: [0, -15],
});

const startIcon = createLabeledIcon('START', '#10b981'); // Emerald 500
const endIcon = createLabeledIcon('END', '#f43f5e'); // Rose 500

export default function WorkerTrailMapLayer({ trailData, isVisible }) {
  if (!isVisible || !trailData || trailData.coordinates.length === 0) {
    return null;
  }

  const polylinePositions = trailData.coordinates.map(coord => [coord.lat, coord.lng]);
  const startPoint = polylinePositions[0];
  const endPoint = polylinePositions[polylinePositions.length - 1];

  const formatDateTime = (isoString) => {
    if (!isoString) return { date: 'N/A', time: 'N/A' };
    const d = new Date(isoString);
    return {
      date: d.toLocaleDateString(),
      time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
  };

  const startInfo = formatDateTime(trailData.startTime);
  const endInfo = formatDateTime(trailData.endTime);

  return (
    <>
      {/* 1+ points: Render START */}
      {startPoint && (
        <Marker position={startPoint} icon={startIcon}>
          <Popup className="rounded-xl shadow-lg border-0 overflow-hidden">
            <div className="font-medium text-foreground">
              <div className="text-success font-bold mb-1">START POINT</div>
              <div className="text-sm">Date: {startInfo.date}</div>
              <div className="text-sm">Time: {startInfo.time}</div>
            </div>
          </Popup>
        </Marker>
      )}
      
      {/* 2+ points: Render END */}
      {endPoint && polylinePositions.length > 1 && (
        <Marker position={endPoint} icon={endIcon}>
          <Popup className="rounded-xl shadow-lg border-0 overflow-hidden">
            <div className="font-medium text-foreground">
              <div className="text-destructive font-bold mb-1">END POINT</div>
              <div className="text-sm">Date: {endInfo.date}</div>
              <div className="text-sm">Time: {endInfo.time}</div>
            </div>
          </Popup>
        </Marker>
      )}

      {/* 2+ points: Render Polyline */}
      {polylinePositions.length > 1 && (
        <Polyline 
          positions={polylinePositions} 
          pathOptions={{ color: '#0ea5e9', weight: 4, opacity: 0.8 }} 
        />
      )}
    </>
  );
}
