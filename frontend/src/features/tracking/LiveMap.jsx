import React, { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet marker icons not resolving correctly with Vite/Webpack
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  iconRetinaUrl: iconRetina,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

/**
 * Ensures Leaflet recalculates tile bounds and layout whenever the container
 * resizes, transitions between responsive breakpoints, or unhides.
 */
function MapResizeHandler() {
  const map = useMap();

  useEffect(() => {
    // Initial size validation after mount
    const timer1 = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    const timer2 = setTimeout(() => {
      map.invalidateSize();
    }, 400);

    const handleResize = () => {
      map.invalidateSize();
    };

    window.addEventListener('resize', handleResize);

    let resizeObserver;
    const container = map.getContainer();
    if (typeof ResizeObserver !== 'undefined' && container) {
      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(container);
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [map]);

  return null;
}

/**
 * LiveMap component serving as the base infrastructure.
 * Fills the parent container with responsive fallback heights.
 * Includes OpenStreetMap tiles, zoom, pan support, and automated resize observer.
 */
export default function LiveMap({
  center = [37.7749, -122.4194],
  zoom = 13,
  children,
  className = '',
  style = {}
}) {
  return (
    <div 
      className={`w-full h-full min-h-[420px] sm:min-h-[500px] lg:min-h-full flex-1 flex flex-col relative ${className}`} 
      style={{ minHeight: '420px', ...style }}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ width: '100%', height: '100%', minHeight: '420px', flex: '1 1 auto' }}
        zoomControl={true}
      >
        <MapResizeHandler />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {children}
      </MapContainer>
    </div>
  );
}
