import React, { useState, useRef, useCallback } from 'react';
import GpxParser from 'gpxparser';
import Statistics from './components/Statistics';
import MapComponent from './components/MapComponent';
import ChartComponent from './components/ChartComponent';
import TimelineScrubber from './components/TimelineScrubber';
import EditControls from './components/EditControls';

// Import Leaflet styles
import 'leaflet/dist/leaflet.css';

// Define and export a type for our track points for better type safety
export type TrackPoint = {
  lat: number;
  lon: number;
  ele: number;
  time: Date;
  speed?: number;
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
        if (parser.tracks.length > 0) {
            const points: TrackPoint[] = parser.tracks[0].points.map(p => ({
                lat: p.lat,
                lon: p.lon,
                ele: p.ele ?? 0,
                time: new Date(p.time),
                // Safely access speed property
                speed: 'speed' in p && typeof p.speed === 'number' ? p.speed : undefined
            }));
            setTrackPoints(points);
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
                  <ChartComponent points={trackPoints} onPointSelect={setActivePointIndex} />
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