import React, { useMemo, useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import type { ChartOptions, InteractionItem, Plugin } from 'chart.js';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js';
import type { TrackPoint } from '../App';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface ChartComponentProps {
  points: TrackPoint[];
  activePointIndex: number | null;
  onPointSelect: (index: number | null) => void;
}

type ChartDataType = 'elevation' | 'speed';

const verticalLinePlugin: Plugin = {
    id: 'verticalLine',
    afterDraw: (chart) => {
        const activePointIndex = (chart.options.plugins as any)?.verticalLine?.activePointIndex;
        if (activePointIndex !== null && activePointIndex < chart.data.labels!.length) {
            const ctx = chart.ctx;
            const meta = chart.getDatasetMeta(0);
            const x = meta.data[activePointIndex].x;
            const topY = chart.scales.y.top;
            const bottomY = chart.scales.y.bottom;

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(x, topY);
            ctx.lineTo(x, bottomY);
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#ffc107';
            ctx.stroke();
            ctx.restore();
        }
    }
};

const ChartComponent: React.FC<ChartComponentProps> = ({ points, activePointIndex, onPointSelect }) => {
  const [chartType, setChartType] = useState<ChartDataType>('elevation');

  const hasSpeedData = useMemo(() => points.some(p => p.speed !== undefined && p.speed !== null), [points]);

  useEffect(() => {
    if (!hasSpeedData) {
      setChartType('elevation');
    }
  }, [hasSpeedData]);

  const chartData = useMemo(() => {
    if (points.length === 0) return null;

    const labels = points.map(p => p.time.getTime());
    const dataSet = chartType === 'elevation'
        ? points.map(p => p.ele)
        : points.map(p => (p.speed ?? 0) * 3.6); // m/s to km/h

    return {
      labels,
      datasets: [
        {
          label: chartType === 'elevation' ? '標高 (m)' : '速度 (km/h)',
          data: dataSet,
          borderColor: chartType === 'elevation' ? 'rgb(53, 162, 235)' : 'rgb(255, 99, 132)',
          backgroundColor: chartType === 'elevation' ? 'rgba(53, 162, 235, 0.5)' : 'rgba(255, 99, 132, 0.5)',
          pointRadius: 0,
          tension: 0.1,
        },
      ],
    };
  }, [points, chartType]);

  const options: ChartOptions<'line'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time',
        time: {
            tooltipFormat: 'HH:mm:ss',
            displayFormats: { minute: 'HH:mm', hour: 'HH:mm' }
        },
        ticks: { maxRotation: 0, minRotation: 0, autoSkip: true, maxTicksLimit: 7 },
      },
      y: {
        type: 'linear' as const,
        position: 'left' as const,
        title: { display: true, text: chartType === 'elevation' ? '標高 (m)' : '速度 (km/h)' },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
      verticalLine: { // Custom plugin options
          activePointIndex: activePointIndex
      }
    },
    interaction: {
        intersect: false,
        mode: 'index',
    },
    onClick: (_, elements: InteractionItem[]) => {
        if (elements.length > 0) {
            onPointSelect(elements[0].index);
        }
    }
  }), [chartType, onPointSelect, activePointIndex]);


  if (!chartData) return null;

  return (
    <div className="mt-3">
        <h6><strong>分析グラフ</strong></h6>
        <div className="mb-2">
            <div className="form-check form-check-inline">
                <input className="form-check-input" type="radio" name="chart-axis" id="chart-elevation" value="elevation" checked={chartType === 'elevation'} onChange={() => setChartType('elevation')} />
                <label className="form-check-label" htmlFor="chart-elevation">標高</label>
            </div>
            <div className="form-check form-check-inline">
                <input className="form-check-input" type="radio" name="chart-axis" id="chart-speed" value="speed" checked={chartType === 'speed'} onChange={() => setChartType('speed')} disabled={!hasSpeedData} />
                <label className="form-check-label" htmlFor="chart-speed">速度</label>
            </div>
        </div>
        <div style={{ height: '150px' }}>
            <Line options={options} data={chartData} plugins={[verticalLinePlugin]} />
        </div>
    </div>
  );
};

export default ChartComponent;