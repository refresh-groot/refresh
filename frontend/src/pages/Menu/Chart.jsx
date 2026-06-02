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
  light: {label: '조도', color: 'rgb(255, 205, 86)', unit: 'lx', limit: 400}, // 400으로 수정
}

function PlantChart({ activeTab = 'soil', statsData = {} }) {

  const {
    dateLabels = [],
    moistureData = [],
    tempData = [],
    lightData = [],
    dailyErrors = [],
    thresholds = {}
  } = statsData;
  

  const config = THEME[activeTab];

  const currentData = useMemo(() => {
    if (activeTab === 'soil') return moistureData;
    if (activeTab === 'temp') return tempData;
    if (activeTab === 'light') return lightData;
    return [];
  }, [activeTab, moistureData, tempData, lightData]);

  const currentLimit = useMemo(() => {
    // statsData.thresholds가 있다면 그걸 쓰고, 없으면 THEME의 기본값 사용
    return thresholds[activeTab === 'soil' ? 'moisture' : activeTab] ?? config.limit;
}, [activeTab, thresholds, config.limit]);

  const data = useMemo(() => ({
    labels: dateLabels.map(label => label.slice(5)),
    datasets: [{
      label: config.label,
      data: currentData.map(v => v === 0 ? null : v),
      borderColor: config.color,
      backgroundColor: config.color.replace('rgb', 'rgba').replace(')', ', 0.2)'),
      tension: 0.4,
      fill: true,
      spanGaps: false,
    }]
  }), [config, currentData, dateLabels]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { right: 20 } },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          afterBody: (tooltipItems) => {
            const index = tooltipItems[0].dataIndex;
            const errors = dailyErrors[index];
            if (errors && errors.length > 0) {
              return ['', '⚠️ 에러 이력:', ...errors];
            }
            return [];
          }
        }
      },
      annotation: {
        annotations: {
          limitLine: {
            type: 'line',
            yMin: currentLimit,
            yMax: currentLimit,
            borderColor: 'rgba(255, 0, 0, 0.5)',
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
              display: true,
              content: `주의 수치 (${currentLimit})`,
              position: 'end'
            }
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
  }), [config, currentLimit, dailyErrors]);

  return (
    <div className='Chart-canvas'>
      <Line data={data} options={options} />
    </div>
  );
}

export default React.memo(PlantChart);