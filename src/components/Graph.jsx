import { useState, useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { useWorkoutStats } from '../hooks/useWorkoutStats';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, ChartDataLabels);

const PERIODS = {
  semana: { label: 'Semana', days: 7 },
  mes: { label: 'Mes', days: 30 },
  '3meses': { label: '3 Meses', days: 90 },
};

function Graph() {
  const [metrica, setMetrica] = useState('duracion');
  const [periodo, setPeriodo] = useState('semana');
  const { datos, loading } = useWorkoutStats();

  const filtrados = useMemo(() => {
    const days = PERIODS[periodo].days;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return datos.filter((d) => new Date(d.fechaISO) >= cutoff);
  }, [datos, periodo]);

  if (loading) return <div className="chart-container" style={{ height: '200px' }} />;

  const isCompact = periodo !== 'semana';

  const chartData = {
    labels: filtrados.map((d) => d.fecha),
    datasets: [
      {
        data: filtrados.map((d) => d[metrica]),
        backgroundColor: '#3b82f6',
        borderRadius: 4,
        barPercentage: isCompact ? 0.7 : 0.5,
        categoryPercentage: isCompact ? 0.8 : 0.6,
      },
    ],
  };

  return (
    <div className="chart-container" style={{ height: '220px' }}>
      <div className="chart-period-buttons" style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        {Object.entries(PERIODS).map(([key, { label }]) => (
          <button
            key={key}
            className={periodo === key ? 'active' : ''}
            onClick={() => setPeriodo(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ height: isCompact ? '190px' : '160px' }}>
        <Bar
          data={chartData}
          options={{
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              datalabels: {
                display: !isCompact,
                color: 'white',
                anchor: 'end',
                align: 'top',
                font: { weight: 'bold', size: 11 },
                formatter: (value) => {
                  if (metrica === 'volume') return `${value} kg`;
                  if (metrica === 'sets') return `${value} sets`;
                  if (metrica === 'duration') return `${value} min`;
                  return value;
                },
              },
            },
            scales: {
  x: {
    ticks: {
      autoSkip: true,
      maxRotation: isCompact ? 60 : 0,
      minRotation: isCompact ? 60 : 0,
      maxTicksLimit: periodo === 'semana' ? 7 : periodo === 'mes' ? 10 : 12,
      color: '#8e8e93',
      font: { size: 10 },
    },
    grid: { display: false },
  },
  y: {
    grace: '10%',
    ticks: { color: '#8e8e93' },
  },
},
          }}
        />
      </div>

      <div className="chart-buttons">
        <button
          className={metrica === 'duration' ? 'active' : ''}
          onClick={() => setMetrica('duration')}
        >
          Duración
        </button>
        <button
          className={metrica === 'volume' ? 'active' : ''}
          onClick={() => setMetrica('volume')}
        >
          Volumen
        </button>
        <button
          className={metrica === 'sets' ? 'active' : ''}
          onClick={() => setMetrica('sets')}
        >
          Sets
        </button>
      </div>
    </div>
  );
}

export default Graph;