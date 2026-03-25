import React, {useState, useMemo} from 'react';
// 필요한 부품들 불러오기
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  layouts,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import annotationPlugin from 'chartjs-plugin-annotation';

// 사용 레지스터 등록하기
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  annotationPlugin,
);

const THEME = {
  soil: {label: '토양 수분', color: 'rgb(75, 192, 192)', unit: '%', limit: 30},
  temp: {label: '온도', color: 'rgb(255, 99, 132)', unit: '°C', limit: 28},
  humid: {label: '습도', color: 'rgb(54, 162, 235)', unit: '%', limit: 70},
  light: {label: '조도', color: 'rgb(255, 205, 86)', unit: 'lx', limit: 200},
}

function PlantChart({activeTab = 'soil', dataList = []}) {

  const config = THEME[activeTab];
  const labels = useMemo(() => {
    return Array.from({ length: 7}, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return `${d.getMonth() + 1}/${d.getDate()}`;
    });
  }, []);
  
  const data = useMemo(() => ({
    labels: labels,
    datasets: [{
      label: config.label,
      data: dataList,
      borderColor: config.color,
      backgroundColor: config.color.replace('rgb', 'rgba').replace(')', ', 0.2)'),
      tension: 0.4,
      fill: true,
    }]
  }), [config, dataList, labels]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { right: 20 } },
    plugins: {
      legend: { display: false },
      annotation: {
        annotations: {
          limitLine: {
            type: 'line',
            yMin: config.limit,
            yMax: config.limit,
            borderColor: 'rgba(255, 0, 0, 0.5)',
            borderWidth: 2,
            borderDash: [5, 5],
            label: { display: true, content: `주의 수치 (${config.limit})`, position: 'end' }
          }
        }
      }
    },
    scales: {
      y: { 
        beginAtZero: true,
        title: { display: true, text: config.unit } 
      }
    }
  }), [config]);

  return (
<div className='Chart-canvas'>
        <Line data={data} options={options} />
      </div>
  );
}

export default React.memo(PlantChart);