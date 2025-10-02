import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { TrackPoint } from '../App';

interface TimelineScrubberProps {
  points: TrackPoint[];
  onPositionChange: (index: number | null) => void;
  onRangeChange: (range: [number, number] | null) => void;
  activePointIndex: number | null;
  selectionRange: [number, number] | null;
}

const TimelineScrubber: React.FC<TimelineScrubberProps> = ({ points, onPositionChange, onRangeChange, activePointIndex, selectionRange }) => {
  const scrubberRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<null | 'position' | 'start' | 'end'>(null);

  const pointsLength = points.length;

  const getIndexFromX = useCallback((x: number) => {
    if (!scrubberRef.current) return 0;
    const rect = scrubberRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (x - rect.left) / rect.width));
    return Math.round(percentage * (pointsLength - 1));
  }, [pointsLength]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!dragging || !scrubberRef.current) return;

    const newIndex = getIndexFromX(event.clientX);

    if (dragging === 'position') {
      onPositionChange(newIndex);
    } else if (dragging === 'start') {
      const end = selectionRange ? selectionRange[1] : newIndex;
      onRangeChange([Math.min(newIndex, end), end]);
    } else if (dragging === 'end') {
      const start = selectionRange ? selectionRange[0] : newIndex;
      onRangeChange([start, Math.max(newIndex, start)]);
    }
  }, [dragging, getIndexFromX, onPositionChange, onRangeChange, selectionRange]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  useEffect(() => {
    if (dragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, handleMouseMove, handleMouseUp]);

  if (pointsLength === 0) return null;

  const getPercentage = (index: number | null) => {
    if (index === null || pointsLength <= 1) return 0;
    return (index / (pointsLength - 1)) * 100;
  };

  const positionPercent = getPercentage(activePointIndex);
  const startPercent = getPercentage(selectionRange ? selectionRange[0] : 0);
  const endPercent = getPercentage(selectionRange ? selectionRange[1] : pointsLength - 1);


  return (
    <div className="mx-2">
      <div ref={scrubberRef} style={{ width: '100%', height: '40px', backgroundColor: '#e9ecef', position: 'relative', borderRadius: '5px', marginTop: '1rem', cursor: 'pointer' }}>
          <div style={{ position: 'absolute', height: '6px', backgroundColor: '#adb5bd', top: '50%', left: '0', right: '0', transform: 'translateY(-50%)', borderRadius: '3px' }}></div>
          {selectionRange && (
              <div style={{ position: 'absolute', height: '6px', backgroundColor: '#0d6efd', top: '50%', left: `${startPercent}%`, width: `${endPercent - startPercent}%`, transform: 'translateY(-50%)' }}></div>
          )}
          <div
              style={{ position: 'absolute', top: '50%', left: `${startPercent}%`, width: '18px', height: '18px', backgroundColor: '#fff', border: '2px solid #0d6efd', borderRadius: '50%', transform: 'translate(-50%, -50%)', cursor: 'ew-resize', zIndex: 2 }}
              onMouseDown={(e) => { e.stopPropagation(); setDragging('start'); }}
              title="範囲開始点"
          ></div>
          <div
              style={{ position: 'absolute', top: '50%', left: `${endPercent}%`, width: '18px', height: '18px', backgroundColor: '#fff', border: '2px solid #0d6efd', borderRadius: '50%', transform: 'translate(-50%, -50%)', cursor: 'ew-resize', zIndex: 2 }}
              onMouseDown={(e) => { e.stopPropagation(); setDragging('end'); }}
              title="範囲終了点"
          ></div>
          {activePointIndex !== null && (
              <div
                  style={{ position: 'absolute', top: '50%', left: `${positionPercent}%`, width: '18px', height: '18px', backgroundColor: '#ffc107', borderColor: '#ffc107', borderRadius: '50%', transform: 'translate(-50%, -50%)', cursor: 'grab', zIndex: 3 }}
                  onMouseDown={(e) => { e.stopPropagation(); setDragging('position'); }}
                  title="現在位置"
              ></div>
          )}
      </div>
    </div>
  );
};

export default TimelineScrubber;