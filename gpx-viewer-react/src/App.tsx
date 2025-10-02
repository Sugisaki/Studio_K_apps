import React, { useState, useRef, useCallback } from 'react';
import GpxParser from 'gpxparser';
import Statistics from './components/Statistics';
import MapComponent from './components/MapComponent';
import ChartComponent from './components/ChartComponent';
import TimelineScrubber from './components/TimelineScrubber';
import EditControls from './components/EditControls';

// Import Leaflet styles
import 'leaflet/dist/leaflet.css';
// Import date adapter for chart.js
import 'chartjs-adapter-date-fns';

// Define and export a type for our track points for better type safety
export type TrackPoint = {
  lat: number;
  lon: number;
  ele: number;
  time: Date;
  speed?: number;
  distance?: number; // For route data
  isRouteData?: boolean; // Flag to indicate if this is route data
};

function App() {
  const [trackPoints, setTrackPoints] = useState<TrackPoint[]>([]);

  // State for interactivity
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);
  const [selectionRange, setSelectionRange] = useState<[number, number] | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const gpxString = e.target?.result as string;
      if (gpxString) {
        const parser = new GpxParser();
        parser.parse(gpxString);
        
        let rawPoints: any[] = [];
        let isRouteData = false;
        
        if (parser.tracks.length > 0) {
            // Track data (with time)
            rawPoints = parser.tracks[0].points.map(p => ({
                lat: p.lat,
                lon: p.lon,
                ele: p.ele ?? 0,
                time: new Date(p.time),
                speed: 'speed' in p && typeof p.speed === 'number' ? p.speed : undefined
            }));
            isRouteData = false;
        } else if (parser.routes.length > 0) {
            // Route data (without time, distance-based)
            rawPoints = parser.routes[0].points.map(p => ({
                lat: p.lat,
                lon: p.lon,
                ele: p.ele ?? 0,
                time: new Date(0), // dummy time for route data
                speed: undefined
            }));
            isRouteData = true;
        }
        
        if (rawPoints.length > 0) {
            // Helper function to calculate distance using Haversine formula
            const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
                const R = 6371000; // Earth radius in meters
                const dLat = (lat2 - lat1) * Math.PI / 180;
                const dLon = (lon2 - lon1) * Math.PI / 180;
                const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                         Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                         Math.sin(dLon/2) * Math.sin(dLon/2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                return R * c; // meters
            };
            
            // Calculate cumulative distance for route data
            const calculateCumulativeDistance = (points: typeof rawPoints) => {
                let cumulativeDistance = 0;
                return points.map((point, index) => {
                    if (index > 0) {
                        const distance = calculateDistance(
                            points[index - 1].lat, points[index - 1].lon,
                            point.lat, point.lon
                        );
                        cumulativeDistance += distance;
                    }
                    return { ...point, distance: cumulativeDistance };
                });
            };

            // Calculate moving median elevation for route data (25m window)
            const calculateMovingMedianElevation = (points: any[]): any[] => {
                const windowDistance = 25; // 25-meter window
                
                return points.map((point) => {
                    const currentDistance = point.distance;
                    const windowStart = currentDistance - windowDistance / 2;
                    const windowEnd = currentDistance + windowDistance / 2;
                    
                    const windowElevations: number[] = [];
                    for (const p of points) {
                        if (p.distance >= windowStart && p.distance <= windowEnd) {
                            windowElevations.push(p.ele);
                        }
                    }
                    
                    if (windowElevations.length === 0) {
                        return point;
                    }
                    
                    // Calculate median elevation
                    windowElevations.sort((a, b) => a - b);
                    const medianElevation = windowElevations.length % 2 === 0
                        ? (windowElevations[windowElevations.length / 2 - 1] + windowElevations[windowElevations.length / 2]) / 2
                        : windowElevations[Math.floor(windowElevations.length / 2)];
                    
                    return { ...point, ele: medianElevation };
                });
            };

            // Calculate speed using moving median with 15-second window (for track data)
            const calculateMovingMedianSpeed = (points: typeof rawPoints): TrackPoint[] => {
                const windowSeconds = 15; // 15-second window
                
                return points.map((point, index) => {
                    if (point.speed !== undefined) {
                        return point; // Use existing speed data
                    }
                    
                    if (index === 0) {
                        return { ...point, speed: 0 }; // First point has no speed
                    }
                    
                    // Find points within the time window centered on current point
                    const currentTime = point.time.getTime();
                    const windowStart = currentTime - (windowSeconds * 1000) / 2;
                    const windowEnd = currentTime + (windowSeconds * 1000) / 2;
                    
                    const windowIndices: number[] = [];
                    for (let i = 0; i < points.length; i++) {
                        const time = points[i].time.getTime();
                        if (time >= windowStart && time <= windowEnd) {
                            windowIndices.push(i);
                        }
                    }
                    
                    if (windowIndices.length < 2) {
                        return { ...point, speed: 0 };
                    }
                    
                    // Calculate instantaneous speeds between consecutive points in the window
                    const speeds: number[] = [];
                    
                    for (let i = 0; i < windowIndices.length - 1; i++) {
                        const idx1 = windowIndices[i];
                        const idx2 = windowIndices[i + 1];
                        const p1 = points[idx1];
                        const p2 = points[idx2];
                        
                        const timeDiff = (p2.time.getTime() - p1.time.getTime()) / 1000; // seconds
                        
                        if (timeDiff > 0) {
                            const distance = calculateDistance(p1.lat, p1.lon, p2.lat, p2.lon);
                            const speed = distance / timeDiff; // m/s
                            speeds.push(speed);
                        }
                    }
                    
                    if (speeds.length === 0) {
                        return { ...point, speed: 0 };
                    }
                    
                    // Calculate median speed
                    speeds.sort((a, b) => a - b);
                    const medianSpeed = speeds.length % 2 === 0
                        ? (speeds[speeds.length / 2 - 1] + speeds[speeds.length / 2]) / 2
                        : speeds[Math.floor(speeds.length / 2)];
                    
                    return { ...point, speed: medianSpeed };
                });
            };
            
            let points: TrackPoint[];
            
            if (isRouteData) {
                // Process route data (distance-based)
                const pointsWithDistance = calculateCumulativeDistance(rawPoints);
                const pointsWithSmoothedElevation = calculateMovingMedianElevation(pointsWithDistance);
                
                // Convert to TrackPoint format for route data
                points = pointsWithSmoothedElevation.map((point, index) => ({
                    lat: point.lat,
                    lon: point.lon,
                    ele: point.ele,
                    time: new Date(index * 1000), // Use index as dummy time for distance-based x-axis
                    speed: undefined, // No speed for route data
                    distance: point.distance, // Add distance property for route data
                    isRouteData: true // Flag to indicate this is route data
                })) as TrackPoint[];
            } else {
                // Process track data (time-based)
                points = calculateMovingMedianSpeed(rawPoints);
            }
            
            setTrackPoints(points);
        } else {
            console.warn('No tracks or routes found in GPX file');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleReset = useCallback(() => {
    setTrackPoints([]);
    setActivePointIndex(null);
    setSelectionRange(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  }, []);

  const handleCrop = useCallback(() => {
    if (!selectionRange) return;
    const [start, end] = selectionRange;
    setTrackPoints(prevPoints => prevPoints.slice(start, end + 1));
    setSelectionRange(null);
    setActivePointIndex(null);
  }, [selectionRange]);

  const handleDelete = useCallback(() => {
    if (!selectionRange) return;
    const [start, end] = selectionRange;
    setTrackPoints(prevPoints => [
      ...prevPoints.slice(0, start),
      ...prevPoints.slice(end + 1)
    ]);
    setSelectionRange(null);
    setActivePointIndex(null);
  }, [selectionRange]);

  const hasGpxData = trackPoints.length > 0;

  return (
    <div className="container mt-4 mb-4">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="card mb-4">
            <div className="card-header">
              <h4 className="mb-0">Round Run GPXビューア (React版)</h4>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label htmlFor="gpx-file" className="form-label">GPXファイルを選択してください</label>
                <div className="input-group">
                    <input
                        className="form-control"
                        type="file"
                        id="gpx-file"
                        accept=".gpx"
                        onChange={handleFileChange}
                        ref={fileInputRef}
                    />
                    {hasGpxData && (
                        <button className="btn btn-outline-secondary" type="button" onClick={handleReset}>
                            リセット
                        </button>
                    )}
                </div>
                <small className="text-muted">
                  ファイルはご使用のブラウザ内でのみ処理されます。サーバーにはアップロードされません。
                </small>
              </div>

              {hasGpxData ? (
                <div>
                  <Statistics points={trackPoints} />
                  <div className="mt-3">
                    <MapComponent points={trackPoints} activePoint={activePointIndex !== null ? trackPoints[activePointIndex] : null} />
                  </div>
                  <ChartComponent points={trackPoints} activePointIndex={activePointIndex} onPointSelect={setActivePointIndex} />
                  <TimelineScrubber
                    points={trackPoints}
                    activePointIndex={activePointIndex}
                    selectionRange={selectionRange}
                    onPositionChange={setActivePointIndex}
                    onRangeChange={setSelectionRange}
                  />
                  <EditControls onCrop={handleCrop} onDelete={handleDelete} hasSelection={!!selectionRange} />
                </div>
              ) : (
                <div className="text-center p-5">
                  <p>GPXファイルを選択して、軌跡の表示と分析を開始します。</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;