import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import type { TrackPoint } from '../App';
import { COLORS } from '../App';
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
  selectionRange: [number, number] | null;
  isEditing: boolean;
}

const MapComponent: React.FC<MapComponentProps> = ({ points, activePoint, selectionRange, isEditing }) => {
  if (points.length === 0) {
    return <div style={{ height: '400px', backgroundColor: '#eee', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>地図データを読み込めませんでした。</div>;
  }

  const positions = points.map(p => [p.lat, p.lon] as [number, number]);

  // 選択範囲に応じて軌跡を分割して描画
  const renderTrack = () => {
    if (!selectionRange) {
      // 選択範囲がない場合は編集中でなければ通常色、編集中なら全体をグレーで描画
      const color = isEditing ? COLORS.NON_SELECTED_EDITING : COLORS.NORMAL_TRACK;
      return <Polyline positions={positions} color={color} weight={3} />;
    }

    const [start, end] = selectionRange;
    const polylines = [];

    // 編集中かどうかで選択範囲外の色を決定
    const outsideColor = isEditing ? COLORS.NON_SELECTED_EDITING : COLORS.NORMAL_TRACK;

    // 選択範囲より前の部分
    if (start > 0) {
      const beforeSelection = positions.slice(0, start + 1);
      polylines.push(
        <Polyline 
          key="before" 
          positions={beforeSelection} 
          color={outsideColor} 
          weight={3} 
        />
      );
    }

    // 選択範囲の部分（編集対象範囲色）
    const selectionPositions = positions.slice(start, end + 1);
    polylines.push(
      <Polyline 
        key="selection" 
        positions={selectionPositions} 
        color={COLORS.SELECTION_RANGE} 
        weight={3} 
      />
    );

    // 選択範囲より後の部分
    if (end < positions.length - 1) {
      const afterSelection = positions.slice(end, positions.length);
      polylines.push(
        <Polyline 
          key="after" 
          positions={afterSelection} 
          color={outsideColor} 
          weight={3} 
        />
      );
    }

    return polylines;
  };

  return (
    <MapContainer style={{ height: '400px', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {renderTrack()}
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