import React, { useMemo } from 'react';
import { TrackPoint } from '../App';

interface StatisticsProps {
  points: TrackPoint[];
}

// Helper function from original vanilla JS implementation
function haversineDistance(p1: {lat: number, lon: number}, p2: {lat: number, lon: number}) {
    const R = 6371; // Radius of Earth in km
    const dLat = (p2.lat - p1.lat) * Math.PI / 180;
    const dLon = (p2.lon - p1.lon) * Math.PI / 180;
    const a = Math.sin(dLat/2) ** 2 + Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) * Math.sin(dLon/2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

const Statistics: React.FC<StatisticsProps> = ({ points }) => {
  const stats = useMemo(() => {
    if (points.length < 2) {
      return {
        distance: '0.00',
        elevationGain: 0,
        elevationLoss: 0,
        minElevation: 0,
        maxElevation: 0,
      };
    }

    let totalDistance = 0;
    let elevationGain = 0;
    let elevationLoss = 0;
    let minElevation = Infinity;
    let maxElevation = -Infinity;

    for (let i = 0; i < points.length; i++) {
        const point = points[i];
        if (point.ele !== null) {
            minElevation = Math.min(minElevation, point.ele);
            maxElevation = Math.max(maxElevation, point.ele);
        }
        if (i > 0) {
            totalDistance += haversineDistance(points[i-1], point);
            if (points[i].ele !== null && points[i-1].ele !== null) {
                const diff = points[i].ele - points[i-1].ele;
                if (diff > 0) {
                    elevationGain += diff;
                } else {
                    elevationLoss -= diff;
                }
            }
        }
    }

    return {
      distance: totalDistance.toFixed(2),
      elevationGain: Math.round(elevationGain),
      elevationLoss: Math.round(elevationLoss),
      minElevation: Math.round(minElevation),
      maxElevation: Math.round(maxElevation),
    };
  }, [points]);

  if (points.length === 0) {
    return null;
  }

  return (
    <div className="card statistics-card mt-3">
      <div className="card-body">
        <h6 className="mb-3"><strong>🚶 トラック統計</strong></h6>
        <div className="stat-item">
            <span>総距離:</span>
            <span><strong>{stats.distance} km</strong></span>
        </div>
        <div className="stat-item">
            <span>累積上昇:</span>
            <span><strong>{stats.elevationGain} m</strong></span>
        </div>
        <div className="stat-item">
            <span>累積下降:</span>
            <span><strong>{stats.elevationLoss} m</strong></span>
        </div>
        <div className="stat-item">
            <span>最低標高:</span>
            <span><strong>{stats.minElevation} m</strong></span>
        </div>
        <div className="stat-item" style={{ marginBottom: 0 }}>
            <span>最高標高:</span>
            <span><strong>{stats.maxElevation} m</strong></span>
        </div>
      </div>
    </div>
  );
};

export default Statistics;