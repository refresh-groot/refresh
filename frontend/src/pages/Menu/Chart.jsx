import React from 'react';
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
  annotationPlugin,
);

const THEME = {
  soil: {label: '토양 수분', color: 'rgb(75, 192, 192)', unit: '%', limit: 30},
  temp: {label: '온도', color: 'rgb(255, 99, 132)', unit: '°C', limit: 28},
  humid: {label: '습도', color: 'rgb(54, 162, 235)', unit: '%', limit: 70},
  light: {label: '조도', color: 'rgb(255, 205, 86)', unit: 'lx', limit: 200},
}

// 리액트 컴포넌트 정의
// 'props'를 통해 부모가 주는 데이터를 받을 준비
function PlantChart({ type = 'soil', dataList = []}) {
  const config = THEME[type];
  const last7Days = () => {
    return Array.from({ length: 7}, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return `${d.getMonth() + 1}/${d.getDate()}`;
    });
  };
  
  const data = {
    labels: last7Days(),
    datasets: [{
      label: config.label,
      data: dataList,
      borderColor: config.color,
      backgroundColor: config.color.replace('rgb', 'rgba').replace(')', ', 0.2)'),
      tension: 0.4,
      fill: true,
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, // 카드 크기에 맞게 조절
    layout: {
      padding: {
        right: 20
      }
    },
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
  };

  // 부모가 준 데이터가 있으면 쓰고, 없으면 기본값 사용
  return <Line data={data} options={options} />;
}

export default PlantChart;