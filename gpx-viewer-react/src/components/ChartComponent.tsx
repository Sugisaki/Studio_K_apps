import React from 'react';
import { Line } from 'react-chartjs-2';
import type { ChartOptions } from 'chart.js';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import type { TrackPoint } from '../App';

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
}

const ChartComponent: React.FC<ChartComponentProps> = ({ points }) => {

  const chartData = React.useMemo(() => {
    if (points.length === 0) return null;

    const labels = points.map((_, i) => i);
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

  const options: ChartOptions<'line'> = React.useMemo(() => ({
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
  }), []);


  if (!chartData) return null;

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