import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import type { TrackPoint } from '../App';
import L from 'leaflet';

// Leaflet's default icon paths can break in React. This fixes it.
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;


interface ChangeViewProps {
  points: [number, number][];
}

const ChangeView: React.FC<ChangeViewProps> = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (points && points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [points, map]);
  return null;
};

interface MapComponentProps {
  points: TrackPoint[];
  activePoint: TrackPoint | null;
}

const MapComponent: React.FC<MapComponentProps> = ({ points, activePoint }) => {
  if (points.length === 0) {
    return <div style={{ height: '400px', backgroundColor: '#eee', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>地図データを読み込めませんでした。</div>;
  }

  const positions = points.map(p => [p.lat, p.lon] as [number, number]);

  return (
    <MapContainer style={{ height: '400px', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Polyline positions={positions} color="red" />
      {activePoint && (
        <Marker position={[activePoint.lat, activePoint.lon]}>
          <Popup>
            標高: {activePoint.ele.toFixed(1)}m <br/>
            {activePoint.speed && `速度: ${(activePoint.speed * 3.6).toFixed(1)}km/h`}
          </Popup>
        </Marker>
      )}
      <ChangeView points={positions} />
    </MapContainer>
  );
};

export default MapComponent;