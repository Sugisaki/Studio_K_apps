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
  // トラック情報を保持する状態
  const [trackPoints, setTrackPoints] = useState<TrackPoint[]>([]);

  // インタラクティブ操作のための状態管理
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);  // アクティブな点のインデックス
  const [selectionRange, setSelectionRange] = useState<[number, number] | null>(null);  // 選択範囲

  // ファイル入力要素への参照
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
        
        // トラックデータ（時間情報あり）とルートデータ（時間情報なし）の判別と処理
        if (parser.tracks.length > 0) {
            // トラックデータの処理（時間情報あり）
            rawPoints = parser.tracks[0].points.map(p => ({
                lat: p.lat,
                lon: p.lon,
                ele: p.ele ?? 0,
                time: new Date(p.time),
                speed: 'speed' in p && typeof p.speed === 'number' ? p.speed : undefined
            }));
            isRouteData = false;
        } else if (parser.routes.length > 0) {
            // ルートデータの処理（時間情報なし）
            rawPoints = parser.routes[0].points.map(p => ({
                lat: p.lat,
                lon: p.lon,
                ele: p.ele ?? 0,
                time: new Date(0), // ルートデータ用のダミー時間
                speed: undefined
            }));
            isRouteData = true;
        }
        
        if (rawPoints.length > 0) {
            // ハーバーサイン公式を使用した2点間の距離計算（メートル単位）
            const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
                const R = 6371000; // 地球の半径（メートル）
                const dLat = (lat2 - lat1) * Math.PI / 180;
                const dLon = (lon2 - lon1) * Math.PI / 180;
                const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                         Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                         Math.sin(dLon/2) * Math.sin(dLon/2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                return R * c;
            };
            
            // ルートデータ用の累積距離計算
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

            // ルートデータ用の移動中央値による標高平滑化（25mウィンドウ）
            const calculateMovingMedianElevation = (points: any[]): any[] => {
                const windowDistance = 25; // 25メートルのウィンドウ
                
                return points.map((point) => {
                    const currentDistance = point.distance;
                    const windowStart = currentDistance - windowDistance / 2;
                    const windowEnd = currentDistance + windowDistance / 2;
                    
                    // ウィンドウ内の標高値を収集
                    const windowElevations: number[] = [];
                    for (const p of points) {
                        if (p.distance >= windowStart && p.distance <= windowEnd) {
                            windowElevations.push(p.ele);
                        }
                    }
                    
                    if (windowElevations.length === 0) {
                        return point;
                    }
                    
                    // 中央値の計算
                    windowElevations.sort((a, b) => a - b);
                    const medianElevation = windowElevations.length % 2 === 0
                        ? (windowElevations[windowElevations.length / 2 - 1] + windowElevations[windowElevations.length / 2]) / 2
                        : windowElevations[Math.floor(windowElevations.length / 2)];
                    
                    return { ...point, ele: medianElevation };
                });
            };

            // トラックデータ用の移動中央値による速度計算（15秒ウィンドウ）
            const calculateMovingMedianSpeed = (points: typeof rawPoints): TrackPoint[] => {
                const windowSeconds = 15; // 15秒のウィンドウ
                
                return points.map((point, index) => {
                    // 既存の速度データがある場合はそれを使用
                    if (point.speed !== undefined) {
                        return point;
                    }
                    
                    // 最初のポイントは速度0とする
                    if (index === 0) {
                        return { ...point, speed: 0 };
                    }
                    
                    // 現在のポイントを中心とした時間ウィンドウ内のポイントを探す
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
                    
                    // ウィンドウ内の連続するポイント間の瞬間速度を計算
                    const speeds: number[] = [];
                    
                    for (let i = 0; i < windowIndices.length - 1; i++) {
                        const idx1 = windowIndices[i];
                        const idx2 = windowIndices[i + 1];
                        const p1 = points[idx1];
                        const p2 = points[idx2];
                        
                        const timeDiff = (p2.time.getTime() - p1.time.getTime()) / 1000; // 秒単位
                        
                        if (timeDiff > 0) {
                            const distance = calculateDistance(p1.lat, p1.lon, p2.lat, p2.lon);
                            const speed = distance / timeDiff; // m/s
                            speeds.push(speed);
                        }
                    }
                    
                    if (speeds.length === 0) {
                        return { ...point, speed: 0 };
                    }
                    
                    // 速度の中央値を計算
                    speeds.sort((a, b) => a - b);
                    const medianSpeed = speeds.length % 2 === 0
                        ? (speeds[speeds.length / 2 - 1] + speeds[speeds.length / 2]) / 2
                        : speeds[Math.floor(speeds.length / 2)];
                    
                    return { ...point, speed: medianSpeed };
                });
            };
            
            let points: TrackPoint[];
            
            if (isRouteData) {
                // ルートデータの処理（距離ベース）
                const pointsWithDistance = calculateCumulativeDistance(rawPoints);
                const pointsWithSmoothedElevation = calculateMovingMedianElevation(pointsWithDistance);
                
                // ルートデータをTrackPoint形式に変換
                points = pointsWithSmoothedElevation.map((point, index) => ({
                    lat: point.lat,
                    lon: point.lon,
                    ele: point.ele,
                    time: new Date(index * 1000), // 距離ベースのX軸用のダミー時間
                    speed: undefined,
                    distance: point.distance,
                    isRouteData: true
                })) as TrackPoint[];
            } else {
                // トラックデータの処理（時間ベース）
                points = calculateMovingMedianSpeed(rawPoints);
            }
            
            setTrackPoints(points);
        } else {
            console.warn('GPXファイルにトラックまたはルートが見つかりません');
        }
      }
    };
    reader.readAsText(file);
  };

  // データのリセット処理
  const handleReset = useCallback(() => {
    setTrackPoints([]);
    setActivePointIndex(null);
    setSelectionRange(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  }, []);

  // 選択範囲の切り出し処理
  const handleCrop = useCallback(() => {
    if (!selectionRange) return;
    const [start, end] = selectionRange;
    setTrackPoints(prevPoints => prevPoints.slice(start, end + 1));
    setSelectionRange(null);
    setActivePointIndex(null);
  }, [selectionRange]);

  // 選択範囲の削除処理
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

  // GPXデータが読み込まれているかのフラグ
  const hasGpxData = trackPoints.length > 0;

  return (
    <div className="container-fluid mt-4 mb-4">
      {/* 以下UIコンポーネントの構築 */}
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="card mb-4">
            <div className="card-header">
              <h4 className="mb-0">Round Run GPXビューア</h4>
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