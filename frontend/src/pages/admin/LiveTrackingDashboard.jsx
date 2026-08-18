import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../app/api';
import { socket } from '../../app/socket';
import LiveMap from '../../features/tracking/LiveMap';
import { Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import WorkerTrailMapLayer from './components/WorkerTrailMapLayer';
import NearestWorkerFinder from './components/NearestWorkerFinder';
import WorkerDailySummaryCard from './components/WorkerDailySummaryCard';

// Design System & Motion
import { Card } from '../../common/components/ui/Card';
import { Badge } from '../../common/components/ui/Badge';
import { Input } from '../../common/components/ui/Input';
import { Button } from '../../common/components/ui/Button';
import { EmptyState } from '../../common/components/ui/EmptyState';
import { Skeleton } from '../../common/components/ui/Skeleton';
import { motion } from 'framer-motion';
import { 
  Users, Wifi, WifiOff, Activity, Navigation, LocateFixed, Globe, Target, MapPin, MapPinOff,
  Map, Battery, ShieldAlert, Gauge, XCircle, Filter, Search, RotateCcw
} from 'lucide-react';
import { Select } from '../../common/components/ui/Select';

const INDIA_CENTER = [22.5937, 78.9629];
const DEFAULT_ZOOM = 5;

// Haversine distance formula for frontend validation
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Floating Map Controls Component
function MapController({ workers, selectedWorkerId, onResetCenter, isNearestMode, onToggleNearestMode, clickedLocation, nearestWorkers, showTrail, trailData }) {
  const map = useMap();

  useEffect(() => {
    if (selectedWorkerId && workers[selectedWorkerId]) {
      const w = workers[selectedWorkerId];
      if (w.latitude != null && w.longitude != null) {
        if (showTrail && trailData && trailData.coordinates && trailData.coordinates.length > 1) {
          const trailCoords = trailData.coordinates.map(c => [c.lat, c.lng]);
          const bounds = L.latLngBounds([...trailCoords, [w.latitude, w.longitude]]);
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16, animate: true, duration: 1.5 });
        } else {
          map.flyTo([w.latitude, w.longitude], 16, { animate: true, duration: 1.5 });
        }
      }
    }
  }, [selectedWorkerId, workers, map, showTrail, trailData]);

  useEffect(() => {
    if (isNearestMode && clickedLocation && nearestWorkers && nearestWorkers.length > 0) {
      const bounds = L.latLngBounds([
        [clickedLocation.lat, clickedLocation.lng],
        ...nearestWorkers.map(w => [w.latitude, w.longitude])
      ]);
      map.fitBounds(bounds, { padding: [80, 80], maxZoom: 15, animate: true, duration: 1.5 });
    }
  }, [isNearestMode, clickedLocation, nearestWorkers, map]);

  useEffect(() => {
    if (!selectedWorkerId && !isNearestMode) {
      const validWorkers = Object.values(workers).filter(w => w.latitude != null && w.longitude != null);
      if (validWorkers.length > 0) {
        const bounds = L.latLngBounds(validWorkers.map(w => [w.latitude, w.longitude]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16, animate: true, duration: 1.5 });
      } else {
        map.flyTo(INDIA_CENTER, DEFAULT_ZOOM, { animate: true, duration: 1.5 });
      }
    }
  }, [workers, selectedWorkerId, isNearestMode, map]);

  return (
    <div className="leaflet-bottom leaflet-right mb-6 mr-2 flex flex-col gap-2 pointer-events-auto" style={{ zIndex: 1000 }}>
      <button 
        onClick={() => {
          
          onToggleNearestMode();
        }} 
        className={`${isNearestMode ? 'bg-primary text-white ring-4 ring-primary/20' : 'bg-surface text-primary hover:bg-primary/5'} shadow-lg p-3 rounded-full transition-all group relative border border-border/50`} 
        title="Find Nearest Workers"
      >
        <Target className="w-5 h-5" />
      </button>
      <button onClick={() => onResetCenter(true)} className="bg-surface hover:bg-primary/5 text-foreground shadow-md p-2.5 rounded-full transition-colors border border-border/50" title="Center on Workers">
        <Users className="w-5 h-5 text-primary" />
      </button>
      <button onClick={() => map.flyTo(INDIA_CENTER, DEFAULT_ZOOM, { animate: true })} className="bg-surface hover:bg-surface-muted text-foreground shadow-md p-2.5 rounded-full transition-colors border border-border/50" title="Center on Region">
        <Globe className="w-5 h-5 text-info" />
      </button>
      <button onClick={() => {
        if (navigator.geolocation) {
          
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              
              map.flyTo([pos.coords.latitude, pos.coords.longitude], 16, { animate: true, duration: 1.5 });
            },
            (error) => {
              console.warn('[LOCATION] Admin Locate Me error:', error.message);
            },
            { enableHighAccuracy: false, maximumAge: 60000, timeout: 10000 }
          );
        }
      }} className="bg-surface hover:bg-success/5 text-foreground shadow-md p-2.5 rounded-full transition-colors border border-border/50" title="Locate Me">
        <LocateFixed className="w-5 h-5 text-success" />
      </button>
    </div>
  );
}

import { PageHeader } from '../../common/components/ui/PageHeader';
import { BatteryIndicator } from '../../common/components/ui/BatteryIndicator';
import { Avatar } from '../../common/components/ui/Avatar';
import { TimeAgo } from '../../common/components/ui/TimeAgo';
import { GpsSignalBadge } from '../../common/components/ui/GpsSignalBadge';
import { StatCard } from '../../common/components/ui/StatCard';

export default function LiveTrackingDashboard() {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState({});
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [selectedWorkerId, setSelectedWorkerId] = useState(null);
  
  // Trail State
  const [showTrail, setShowTrail] = useState(false);
  const [trailDate, setTrailDate] = useState(new Date().toISOString().split('T')[0]);
  const [trailData, setTrailData] = useState(null);
  const [trailLoading, setTrailLoading] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOnline, setFilterOnline] = useState('all');
  const [filterAttendance, setFilterAttendance] = useState('all');

  // Nearest Worker State
  const [isNearestMode, setIsNearestMode] = useState(false);
  const [clickedLocation, setClickedLocation] = useState(null);
  const [nearestWorkers, setNearestWorkers] = useState([]);
  const [nearestLoading, setNearestLoading] = useState(false);

  const markerRefs = useRef({});

  // Auto-open popup when selectedWorkerId changes
  useEffect(() => {
    if (selectedWorkerId && markerRefs.current[selectedWorkerId]) {
      markerRefs.current[selectedWorkerId].openPopup();
    }
  }, [selectedWorkerId]);

  const fetchWorkers = async (isMounted = true) => {
    try {
      const response = await api.get('/tracking/active-workers');
      if (isMounted) {
        const workersMap = {};
        response.data.data.forEach(w => workersMap[w.workerId] = w);
        setWorkers(workersMap);
      }
    } catch (err) {
      console.error('Failed to fetch workers', err);
    } finally {
      if (isMounted) setLoading(false);
    }
  };

  const handleMapClick = async (latlng) => {
    
    

    if (!isNearestMode) {
      
      return;
    }
    
    setClickedLocation(latlng);
    
    setNearestLoading(true);
    
    try {
      
      const response = await api.get(`/tracking/nearest?lat=${latlng.lat}&lng=${latlng.lng}`);
      
      setNearestWorkers(response.data.data || []);
      
    } catch (err) {
      console.error('Failed to fetch nearest workers', err);
      setNearestWorkers([]);
    } finally {
      setNearestLoading(false);
    }
  };

  const clearNearestSearch = () => {
    setClickedLocation(null);
    setNearestWorkers([]);
  };

  useEffect(() => {
    let isMounted = true;
    fetchWorkers(isMounted);
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    async function fetchTrail(isAutoRefresh = false) {
      if (!showTrail || !selectedWorkerId) {
        if (!isAutoRefresh) setTrailData(null);
        return;
      }
      if (!isAutoRefresh) setTrailLoading(true);
      try {
        const response = await api.get(`/tracking/trail/${selectedWorkerId}?date=${trailDate}`);
        setTrailData(response.data.data);
      } catch (err) {
        console.error('Failed to fetch worker trail', err);
        if (!isAutoRefresh) setTrailData(null);
      } finally {
        if (!isAutoRefresh) setTrailLoading(false);
      }
    }
    
    // Initial fetch on change
    fetchTrail();

    // The backend socket ('location:updated') handles live appends to the trail state.
    // We no longer aggressively poll `fetchTrail(true)` every 5 seconds.
    // This prevents array overwriting, flickering, and lost start markers.

    return () => {
      // Cleanup if needed in the future
    };
  }, [showTrail, selectedWorkerId, trailDate]);

  useEffect(() => {
    function handleLocationUpdate(data) {
      console.log('--- SOCKET EVENT ---');
      console.log('Event name: location:updated');
      console.log('Worker ID:', data.workerId);
      console.log('Latitude:', data.latitude);
      console.log('Longitude:', data.longitude);
      console.log('currentGeofence:', data.currentGeofence);
      console.log('locationName:', data.locationName);
      console.log('category:', data.category);
      console.log('--------------------');
      
      setWorkers(prev => {
        const existing = prev[data.workerId];
        
        // Validate live location updates (same rules as trail)
        if (existing && existing.latitude != null && existing.longitude != null) {
          const distanceKm = calculateDistanceKm(existing.latitude, existing.longitude, data.latitude, data.longitude);
          
          // Ignore micro-jitter (< 5 meters)
          if (distanceKm > 0 && distanceKm < 0.005) {
            return prev; // Ignore invalid ping
          }
          
          // Ignore impossible GPS jumps (> 150 km/h)
          if (existing.timestamp && data.timestamp) {
            const timeDiffHours = (new Date(data.timestamp) - new Date(existing.timestamp)) / (1000 * 60 * 60);
            if (timeDiffHours > 0) {
              const speedKmh = distanceKm / timeDiffHours;
              if (speedKmh > 150) {
                return prev; // Ignore invalid ping
              }
            }
          }
        }

        return {
          ...prev,
          [data.workerId]: {
            ...(existing || {}),
            ...data,
            // Keep original workerName, attendanceStatus, and geofence state if not provided
            workerName: data.workerName || existing?.workerName || 'Unknown Worker',
            attendanceStatus: existing?.attendanceStatus || 'Active',
            currentGeofence: existing?.currentGeofence || null,
            geofenceArrivalTime: existing?.geofenceArrivalTime || null
          }
        };
      });

      // If trail is showing for this worker for TODAY, append the point with validation
      if (showTrail && selectedWorkerId === data.workerId) {
        const todayStr = new Date().toISOString().split('T')[0];
        if (trailDate === todayStr) {
          setTrailData(prev => {
            if (!prev) return prev;
            
            const lastPoint = prev.coordinates.length > 0 ? prev.coordinates[prev.coordinates.length - 1] : null;
            let distanceIncrement = 0;
            
            if (lastPoint) {
              const distanceKm = calculateDistanceKm(lastPoint.lat, lastPoint.lng, data.latitude, data.longitude);
              
              // Ignore micro-jitter (< 5 meters)
              if (distanceKm < 0.005) {
                return prev;
              }
              
              // Ignore impossible GPS jumps (> 150 km/h)
              const timeDiffHours = (new Date(data.timestamp) - new Date(lastPoint.timestamp)) / (1000 * 60 * 60);
              if (timeDiffHours > 0) {
                const speedKmh = distanceKm / timeDiffHours;
                if (speedKmh > 150) {
                  return prev;
                }
              }
              distanceIncrement = distanceKm;
            }

            return {
              ...prev,
              coordinates: [...prev.coordinates, { lat: data.latitude, lng: data.longitude, timestamp: data.timestamp }],
              endTime: data.timestamp,
              totalPoints: prev.totalPoints + 1,
              totalDistance: prev.totalDistance + distanceIncrement
            };
          });
        }
      }
    }

    function handleGeofenceEntered(data) {
      console.log('--- SOCKET EVENT ---');
      console.log('Event name: geofence:entered');
      console.log('Worker ID:', data.workerId);
      console.log('Latitude:', data.latitude);
      console.log('Longitude:', data.longitude);
      console.log('currentGeofence:', data.geofenceName);
      console.log('locationName:', data.locationName);
      console.log('category:', data.category);
      console.log('--------------------');
      
      setWorkers(prev => {
        const existing = prev[data.workerId];
        if (!existing) return prev;
        return {
          ...prev,
          [data.workerId]: {
            ...existing,
            currentGeofence: data.geofenceName,
            geofenceArrivalTime: data.timestamp
          }
        };
      });
      console.log('Worker State Check:', workers[data.workerId]);
    }

    function handleGeofenceExited(data) {
      setWorkers(prev => {
        const existing = prev[data.workerId];
        if (!existing) return prev;

        console.log('--- SOCKET EVENT ---');
        console.log('Event name: geofence:exited');
        console.log('Exited:\n' + data.geofenceName);
        console.log('Current:\n' + existing.currentGeofence);
        console.log('Equal?\n' + (existing.currentGeofence === data.geofenceName));

        if (existing.currentGeofence !== data.geofenceName) {
          return prev;
        }

        return {
          ...prev,
          [data.workerId]: {
            ...existing,
            currentGeofence: null,
            geofenceArrivalTime: null
          }
        };
      });
    }

    function handleAttendanceCheckedIn(data) {
      setWorkers(prev => {
        const existing = prev[data.workerId] || {};
        return {
          ...prev,
          [data.workerId]: {
            ...existing,
            workerId: data.workerId,
            workerName: data.workerName,
            attendanceStatus: data.status,
          }
        };
      });
    }

    function handleAttendanceCheckedOut(data) {
      setWorkers(prev => {
        const existing = prev[data.workerId];
        if (!existing) return prev;
        return {
          ...prev,
          [data.workerId]: {
            ...existing,
            attendanceStatus: 'checked-out'
          }
        };
      });
    }

    socket.on('location:updated', handleLocationUpdate);
    socket.on('geofence:entered', handleGeofenceEntered);
    socket.on('geofence:exited', handleGeofenceExited);
    socket.on('attendance:checked-in', handleAttendanceCheckedIn);
    socket.on('attendance:checked-out', handleAttendanceCheckedOut);
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    return () => {
      socket.off('location:updated', handleLocationUpdate);
      socket.off('geofence:entered', handleGeofenceEntered);
      socket.off('geofence:exited', handleGeofenceExited);
      socket.off('attendance:checked-in', handleAttendanceCheckedIn);
      socket.off('attendance:checked-out', handleAttendanceCheckedOut);
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [showTrail, selectedWorkerId, trailDate]);

  const activeWorkersList = useMemo(() => {
    return Object.values(workers).filter(w => w.latitude != null && w.longitude != null);
  }, [workers]);
  
  const filteredWorkers = useMemo(() => {
    return activeWorkersList.filter(w => {
      const matchesSearch = (w.workerName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (w.workerId || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const isOnline = w.timestamp && (new Date() - new Date(w.timestamp) < 5 * 60 * 1000);
      const matchesOnline = filterOnline === 'all' || 
                           (filterOnline === 'online' && isOnline) || 
                           (filterOnline === 'offline' && !isOnline);
      
      const matchesAttendance = filterAttendance === 'all' || 
                               (w.attendanceStatus || '').toLowerCase() === filterAttendance.toLowerCase();
                               
      return matchesSearch && matchesOnline && matchesAttendance;
    });
  }, [activeWorkersList, searchQuery, filterOnline, filterAttendance]);

  const onlineCount = activeWorkersList.filter(w => w.timestamp && (new Date() - new Date(w.timestamp) < 5 * 60 * 1000)).length;
  const lastUpdate = activeWorkersList.length > 0 
    ? new Date(Math.max(...activeWorkersList.map(w => new Date(w.timestamp || 0).getTime()))) 
    : null;

  return (
    <div className="flex flex-col gap-6 min-h-[calc(100vh-80px)] max-w-[1600px] mx-auto">
      <PageHeader
        title="Live Tracking Dashboard"
        description="Monitor fleet and field workers in real-time across the region"
        icon={Navigation}
        variant="prominent"
        actions={
          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-surface border border-border/50 shadow-sm">
              <div className="relative flex h-3.5 w-3.5">
                {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>}
                <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${isConnected ? 'bg-success' : 'bg-destructive'}`}></span>
              </div>
              <span className="text-sm font-semibold text-foreground tracking-wide">
                {isConnected ? 'Socket Connected' : 'Disconnected'}
              </span>
            </div>
            {lastUpdate && (
              <p className="text-xs text-muted-foreground font-medium">
                Last signal: <TimeAgo timestamp={lastUpdate} />
              </p>
            )}
          </div>
        }
      />

      {/* KPI Cards (Framer Motion Staggered) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Workers', value: activeWorkersList.length, icon: Users, colorClass: 'text-info dark:text-info-hover', bgClass: 'bg-info/10' },
          { label: 'Online Now', value: onlineCount, icon: Wifi, colorClass: 'text-success dark:text-success-hover', bgClass: 'bg-success/10' },
          { label: 'Offline', value: activeWorkersList.length - onlineCount, icon: WifiOff, colorClass: 'text-destructive dark:text-destructive-hover', bgClass: 'bg-destructive/10' },
          { label: 'Map Status', value: isConnected ? 'Live' : 'Stale', icon: Activity, colorClass: isConnected ? 'text-primary dark:text-primary-hover' : 'text-muted-foreground', bgClass: isConnected ? 'bg-primary/10' : 'bg-surface-muted' },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="p-5 flex items-center gap-4 hover:shadow-md transition-shadow group overflow-hidden relative">
              {/* Subtle hover gradient */}
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-tr from-transparent via-transparent to-${stat.bgClass.split('-')[1]}/5 pointer-events-none`} />
              
              <div className={`p-3.5 rounded-xl ${stat.bgClass} ${stat.colorClass} group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground">{stat.label}</p>
                <motion.h3 
                  className="text-3xl font-black text-foreground mt-0.5 tracking-tight"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={stat.value} // re-animate on change
                >
                  {stat.value}
                </motion.h3>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-[500px] lg:min-h-[650px] w-full">
        {/* Sidebar */}
        <Card className="w-full lg:w-96 flex flex-col shrink-0 border-border/50 bg-surface shadow-xs min-h-[380px] lg:min-h-[650px]">
          <div className="p-5 border-b border-border/50 space-y-4 bg-surface-muted/30">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-lg text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Directory
              </h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => fetchWorkers()}
                className="gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Refresh
              </Button>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                type="text" 
                placeholder="Search workers..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Select 
                  value={filterOnline} 
                  onChange={e => setFilterOnline(e.target.value)}
                  icon={Filter}
                  options={[
                    { value: 'all', label: 'Status' },
                    { value: 'online', label: 'Online' },
                    { value: 'offline', label: 'Offline' }
                  ]}
                />
              </div>
              <div className="relative flex-1">
                <Select 
                  value={filterAttendance} 
                  onChange={e => setFilterAttendance(e.target.value)}
                  icon={Filter}
                  options={[
                    { value: 'all', label: 'Attendance' },
                    { value: 'present', label: 'Present' },
                    { value: 'late', label: 'Late' }
                  ]}
                />
              </div>
            </div>
          </div>

          {isNearestMode && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-primary/5 border-b border-primary/10 p-4"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-primary flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Nearest Workers
                  </h3>
                  <p className="text-xs text-primary/70 mt-1">
                    {!clickedLocation ? 'Click map to find nearest active workers.' : 'Top 3 closest workers shown.'}
                  </p>
                </div>
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={clearNearestSearch}
                  className="text-xs h-7 px-2"
                >
                  Clear
                </Button>
              </div>

              {nearestLoading ? (
                <div className="flex items-center gap-3 text-sm text-primary bg-background p-3 rounded-xl border border-border/50 shadow-sm">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  Calculating distances...
                </div>
              ) : nearestWorkers.length > 0 ? (
                <div className="space-y-2">
                  {nearestWorkers.map((worker, idx) => {
                    const isSelected = selectedWorkerId === worker.workerId;
                    
                    const borderColors = ['border-warning ring-1 ring-warning/30', 'border-primary ring-1 ring-primary/30', 'border-info ring-1 ring-info/30'];
                    const badgeColors = ['bg-warning text-warning-foreground', 'bg-primary text-primary-foreground', 'bg-info text-info-foreground'];
                    const distanceColors = [
                      'text-warning bg-warning/10',
                      'text-primary bg-primary/10',
                      'text-info bg-info/10'
                    ];

                    const borderClass = borderColors[idx] || 'border-border';
                    const badgeClass = badgeColors[idx] || 'bg-muted text-muted-foreground';
                    const distClass = distanceColors[idx] || 'text-foreground bg-muted';
                    
                    return (
                      <motion.div 
                        key={worker.workerId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        onClick={() => setSelectedWorkerId(worker.workerId)}
                        className={`cursor-pointer p-3 rounded-xl border flex justify-between items-center shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5 bg-background ${
                          isSelected ? 'ring-2 ring-primary border-primary/50' : borderClass
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <Avatar 
                              fallback={worker.workerName || 'U'} 
                              size="md" 
                              status={worker.timestamp && (new Date() - new Date(worker.timestamp) < 5 * 60 * 1000) ? 'online' : 'busy'} 
                            />
                            <div className={`absolute -bottom-1 -right-1 ${badgeClass} font-black text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-background shadow-sm`}>{idx + 1}</div>
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-foreground text-sm flex items-center gap-1.5 truncate">
                              {worker.workerName}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-1 space-y-0.5">
                              {worker.currentGeofence ? (
                                <div className="text-primary font-medium truncate w-32 flex items-center gap-1">
                                  <MapPin className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{worker.currentGeofence}</span>
                                </div>
                              ) : (
                                <div>No active assignment</div>
                              )}
                              <div className="text-muted-foreground/70 flex items-center gap-1">Last seen: <TimeAgo timestamp={worker.timestamp} /></div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1.5">
                          <div className={`font-black text-sm px-2 py-0.5 rounded-full ${distClass}`}>
                            {worker.distance.toFixed(2)} km
                          </div>
                          <Badge variant={worker.attendanceStatus === 'present' ? 'success' : 'warning'} className="text-[9px] px-1.5 py-0.5">
                            {worker.attendanceStatus}
                          </Badge>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : clickedLocation ? (
                <div className="text-sm text-muted-foreground bg-background p-3 rounded-xl border border-border/50 text-center shadow-sm">No active workers found within range.</div>
              ) : null}
            </motion.div>
          )}
          
          <div className="flex-1 overflow-y-auto p-3 space-y-2 relative min-h-[280px]">
            {loading ? (
              <div className="space-y-3">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="flex gap-3 p-3 border border-border/50 rounded-xl bg-background">
                    <Skeleton className="w-12 h-12 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2 py-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredWorkers.length === 0 ? (
              <div className="py-8 px-4 flex flex-col justify-center items-center text-center w-full my-auto">
                <EmptyState
                  icon={MapPinOff}
                  title="No active workers"
                  description="There are currently no workers online or broadcasting location data."
                  action={<Button onClick={() => fetchWorkers()} className="w-full">Refresh Directory</Button>}
                  secondaryAction={<Button variant="outline" onClick={() => navigate('/admin/attendance')} className="w-full">Go to Attendance</Button>}
                />
              </div>
            ) : (
              <div className="space-y-2">
                {filteredWorkers.map((worker, index) => {
                  const isOnline = worker.timestamp && (new Date() - new Date(worker.timestamp) < 5 * 60 * 1000);
                  const isSelected = selectedWorkerId === worker.workerId;
                  
                  return (
                    <motion.button
                      key={worker.workerId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setSelectedWorkerId(worker.workerId)}
                      className={`w-full text-left p-4 rounded-xl transition-all duration-200 border relative overflow-hidden group ${
                        isSelected 
                          ? 'bg-primary/5 border-primary/30 shadow-md transform scale-[1.02]' 
                          : 'bg-background border-border/50 hover:border-primary/30 hover:shadow-md'
                      }`}
                    >
                      {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
                      <div className="flex gap-4 items-start">
                        <Avatar 
                          fallback={worker.workerName || 'U'}
                          size="lg" 
                          status={isOnline ? 'online' : 'busy'}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1.5">
                            <h4 className="font-bold text-foreground truncate pr-2">{worker.workerName || 'Unknown Worker'}</h4>
                            {worker.attendanceStatus && (
                              <Badge 
                                variant={
                                  worker.attendanceStatus === 'present' ? 'success' : 
                                  worker.attendanceStatus === 'manual_override' ? 'secondary' :
                                  'warning'
                                }
                                className="text-[10px] px-2 py-0.5 shrink-0"
                              >
                                {worker.attendanceStatus === 'manual_override' ? 'Override' : worker.attendanceStatus}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="space-y-1.5 mb-2.5">
                            {worker.currentGeofence && (
                              <div className="flex items-start gap-1.5 text-xs">
                                <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                                <span className="text-muted-foreground truncate">{worker.currentGeofence}</span>
                              </div>
                            )}

                            {worker.currentTask && (
                              <div className="flex items-start gap-1.5 text-xs">
                                <Target className="w-3.5 h-3.5 text-warning shrink-0 mt-0.5" />
                                <span className="text-muted-foreground truncate">{worker.currentTask}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between text-xs pt-2 border-t border-border/50">
                            <div className="flex items-center gap-2">
                              {worker.batteryLevel !== undefined && (
                                <BatteryIndicator level={worker.batteryLevel} />
                              )}
                              {worker.accuracy !== undefined && (
                                <GpsSignalBadge accuracy={worker.accuracy} variant="inline" showAccuracy={false} />
                              )}
                            </div>
                            <div className="text-muted-foreground">
                              {worker.timestamp ? <TimeAgo timestamp={worker.timestamp} /> : 'Just now'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
          
          {selectedWorkerId && (
            <>
            <div className="p-5 border-t border-border/50 bg-surface-muted/30">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Map className="w-4 h-4 text-primary" /> {workers[selectedWorkerId]?.workerName || 'Worker'}'s Trail
                </h3>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={showTrail} onChange={(e) => setShowTrail(e.target.checked)} />
                  <div className="w-9 h-5 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              
              {showTrail && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <Input 
                    type="date" 
                    value={trailDate} 
                    onChange={(e) => setTrailDate(e.target.value)} 
                    className="w-full text-sm h-9" 
                  />
                  
                    {trailLoading ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium p-2">
                        <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        Loading trail data...
                      </div>
                    ) : !trailData || trailData.coordinates.length === 0 ? (
                      <div className="text-xs text-muted-foreground bg-surface p-2.5 rounded-lg border border-border font-medium">
                        No GPS history available for this date.
                      </div>
                    ) : trailData.coordinates.length === 1 ? (
                      <div className="grid grid-cols-2 gap-3">
                        <StatCard title="Distance" value="0 km" className="p-3 shadow-none border-border/50" />
                        <StatCard title="Points" value="1" subtitle="Ping" className="p-3 shadow-none border-border/50" />
                        <div className="col-span-2">
                          <StatCard title="Movement Status" value="Stationary" colorScheme="warning" className="p-3 shadow-none border-border/50" />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <StatCard title="Distance" value={`${trailData.totalDistance.toFixed(2)} km`} className="p-3 shadow-none border-border/50" />
                        <StatCard title="Points" value={trailData.totalPoints} subtitle="Pings" className="p-3 shadow-none border-border/50" />
                        <div className="col-span-2">
                          <StatCard title="Last Updated" value={trailData.endTime ? <TimeAgo timestamp={trailData.endTime} /> : 'N/A'} className="p-3 shadow-none border-border/50" />
                        </div>
                      </div>
                    )}
                  </motion.div>
              )}
            </div>
            <WorkerDailySummaryCard 
              workerId={selectedWorkerId}
              date={trailDate}
              onClose={() => setSelectedWorkerId(null)}
            />
            </>
          )}
        </Card>

        {/* Map Area */}
        <Card className="w-full flex-1 min-h-[420px] sm:min-h-[520px] lg:min-h-[650px] bg-surface-muted/10 border-border/50 overflow-hidden relative z-0 p-0 flex flex-col shadow-xs">
          {loading && activeWorkersList.length === 0 && (
            <div className="absolute inset-0 z-[1000] bg-background/50 backdrop-blur-sm flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-border border-t-primary rounded-full animate-spin mb-4 shadow-lg"></div>
            </div>
          )}
          <LiveMap center={INDIA_CENTER} zoom={DEFAULT_ZOOM}>
              <MapController 
                workers={workers} 
                selectedWorkerId={selectedWorkerId} 
                onResetCenter={() => setSelectedWorkerId(null)} 
                isNearestMode={isNearestMode}
                onToggleNearestMode={() => {
                  setIsNearestMode(!isNearestMode);
                  if (isNearestMode) clearNearestSearch();
                }}
                showTrail={showTrail}
                trailData={trailData}
              />
            <WorkerTrailMapLayer trailData={trailData} isVisible={showTrail} />
            <NearestWorkerFinder 
              isNearestMode={isNearestMode}
              onMapClick={handleMapClick}
              clickedLocation={clickedLocation}
              nearestWorkers={nearestWorkers}
            />
            
            {activeWorkersList.map(worker => (
              <Marker 
                key={worker.workerId} 
                position={[worker.latitude, worker.longitude]}
                ref={(ref) => {
                  if (ref) markerRefs.current[worker.workerId] = ref;
                }}
                eventHandlers={{
                  click: () => setSelectedWorkerId(worker.workerId),
                }}
              >
                <Popup className="rounded-xl shadow-2xl border-0 overflow-hidden p-0 custom-popup" minWidth={260}>
                  <div className="bg-foreground text-background p-3.5 flex items-center gap-3 rounded-t-lg">
                    <Avatar fallback={worker.workerName || '?'} size="sm" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm truncate">
                        {worker.workerName || 'Unknown Worker'}
                      </h3>
                      <div className="text-[10px] text-background/70 capitalize">
                        {worker.attendanceStatus === 'manual_override' ? 'Override' : (worker.attendanceStatus || 'Active')}
                      </div>
                    </div>
                    <span className={`w-2.5 h-2.5 shrink-0 rounded-full ${worker.timestamp && (new Date() - new Date(worker.timestamp) < 5 * 60 * 1000) ? 'bg-success' : 'bg-destructive'}`} />
                  </div>
                  <div className="p-4 space-y-3 bg-background text-foreground">
                    {worker.currentGeofence && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <div>
                          <div className="text-sm font-medium text-foreground">{worker.currentGeofence}</div>
                          <div className="text-xs text-muted-foreground">Current Location</div>
                        </div>
                      </div>
                    )}

                    {worker.currentTask && (
                      <div className="flex items-start gap-2">
                        <Target className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                        <div>
                          <div className="text-sm font-medium text-foreground truncate">{worker.currentTask}</div>
                          <div className="text-xs text-muted-foreground">Current Task</div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {worker.batteryLevel !== undefined && (
                        <div className="flex items-center gap-2 text-xs border border-border/50 rounded-lg p-2 bg-surface-muted/30">
                          <span className="text-muted-foreground">Battery:</span>
                          <BatteryIndicator level={worker.batteryLevel} />
                        </div>
                      )}
                      
                      {worker.accuracy !== undefined && (
                        <div className="flex items-center gap-2 text-xs border border-border/50 rounded-lg p-2 bg-surface-muted/30">
                          <span className="text-muted-foreground">GPS:</span>
                          <GpsSignalBadge accuracy={worker.accuracy} variant="inline" showAccuracy={false} />
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-xs border-t border-border/50 pt-3">
                      <span className="text-muted-foreground">Last Seen</span>
                      <span className="font-medium text-foreground">
                        {worker.timestamp ? <TimeAgo timestamp={worker.timestamp} /> : 'Just now'}
                      </span>
                    </div>

                    <details className="group border border-border rounded-lg bg-surface/50">
                      <summary className="text-xs font-semibold text-muted-foreground p-2.5 cursor-pointer list-none flex justify-between items-center hover:text-foreground transition-colors">
                        Advanced Details
                        <span className="transform transition-transform group-open:rotate-180">▼</span>
                      </summary>
                      <div className="p-3 border-t border-border bg-background space-y-2">
                        <div className="grid grid-cols-2 gap-y-2 text-xs">
                          <div className="text-muted-foreground">Worker ID</div>
                          <div className="font-mono text-right truncate" title={worker.workerId}>{worker.workerId.slice(-6)}</div>
                          
                          {worker.speed !== undefined && (
                            <>
                              <div className="text-muted-foreground">Speed</div>
                              <div className="font-mono text-right">{Math.round(worker.speed * 3.6)} km/h</div>
                            </>
                          )}

                          <div className="text-muted-foreground">Latitude</div>
                          <div className="font-mono text-right">{worker.latitude.toFixed(5)}</div>

                          <div className="text-muted-foreground">Longitude</div>
                          <div className="font-mono text-right">{worker.longitude.toFixed(5)}</div>
                          
                          {worker.accuracy && (
                            <>
                              <div className="text-muted-foreground">Accuracy</div>
                              <div className="font-mono text-right">±{Math.round(worker.accuracy)}m</div>
                            </>
                          )}
                          
                          <div className="text-muted-foreground">Timestamp</div>
                          <div className="font-mono text-right truncate pl-2" title={worker.timestamp}>{worker.timestamp || 'N/A'}</div>
                        </div>
                      </div>
                    </details>
                  </div>
                </Popup>
              </Marker>
            ))}
          </LiveMap>
        </Card>
      </div>
    </div>
  );
}
