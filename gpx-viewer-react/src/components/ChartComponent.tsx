import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { TrackPoint } from '../App';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ChartComponentProps {
  points: TrackPoint[];
  activePointIndex: number | null;
}

const ChartComponent: React.FC<ChartComponentProps> = ({ points, activePointIndex }) => {
  const chartData = useMemo(() => {
    const labels = points.map((p, i) => i);
    const elevationData = points.map(p => p.ele);

    return {
      labels,
      datasets: [
        {
          label: '標高 (m)',
          data: elevationData,
          borderColor: 'rgb(53, 162, 235)',
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
          pointRadius: 0,
          tension: 0.1,
        },
      ],
    };
  }, [points]);

  const options: ChartOptions<'line'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: {
          display: false,
        },
        grid: {
            display: false,
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: '標高 (m)',
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
      },
    },
    interaction: {
        intersect: false,
        mode: 'index',
    },
    // This is a bit of a trick to highlight the active point
    // by creating a vertical line annotation.
    // We can't directly use chartjs-plugin-annotation without installing it,
    // so we'll simulate it with a custom plugin.
    // For now, we'll skip this complex part and implement it later if needed.
  }), []);


  if (points.length === 0) return null;

  return (
    <div className="mt-3">
        <h6><strong>標高グラフ</strong></h6>
        <div style={{ height: '150px' }}>
            <Line options={options} data={chartData} />
        </div>
    </div>
  );
};

export default ChartComponent;