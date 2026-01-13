import React, { useState, useEffect } from 'react';
import './Menu.css';
import { useLocation } from 'react-router-dom';
import { FaTemperatureHigh, FaTint, FaSun, FaLeaf, FaRobot } from 'react-icons/fa';
import { SERVER_URL } from '../../app/constants';
import { useSensorData } from '../../hooks/useSensorData';
import defaultImg from '../../assets/img/default.png';
import Swal from 'sweetalert2';

function Menu() {
  const location = useLocation();
  const { sensorData, loading: sensorLoading } = useSensorData(5000);
  const [isAutoMode, setIsAutoMode] = useState(true);

  const [alerts] = useState([
    { id: 1, type: 'warning', msg: '물통에 물이 부족합니다!' },
    { id: 2, type: 'success', msg: '오전 09:00 급수 완료' },
  ]);

  const receivedPlant = location.state?.plant;

  const [currentPlant, setCurrentPlant] = useState(() => {
    if (receivedPlant) return receivedPlant;

    const saved = localStorage.getItem('my-plants');
    const parsed = saved ? JSON.parse(saved) : [];
    return parsed.length > 0
      ? parsed[0]
      : {
          plant_name: '식물을 등록해주세요',
          species: '식물 종류',
          reg_date: new Date().toISOString().split('T')[0],
          photo_url: defaultImg,
          status: 'active',
        };
  });

  // receivedPlant 들어오면 currentPlant 갱신
  useEffect(() => {
    if (
      receivedPlant &&
      receivedPlant.plant_name !== currentPlant.plant_name
    ) {
      setCurrentPlant(receivedPlant);
    }
  }, [receivedPlant, currentPlant.plant_name]);

  // 메뉴에서 새로고침해도 보이게 저장
  useEffect(() => {
    if (currentPlant) {
      localStorage.setItem('my-plants', JSON.stringify([currentPlant]));
    }
  }, [currentPlant]);

  const calculateDays = (dateString) => {
    if (!dateString) return 0;
    const start = new Date(dateString);
    const today = new Date();
    const diff = today - start;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return days + 1;
  };

  // 이미지 src 정규화 (오타 startsWith + 서버 경로 붙이기)
  const getImageSrc = (url) => {
    if (!url) return defaultImg;

    // import된 이미지(defaultImg)는 이미 절대/번들 경로라 그대로 사용
    if (typeof url === 'string') {
      if (url.startsWith('http')) return url;
      if (url.startsWith('data:')) return url;

      // DB에 /uploads/xxx.png 형태로 들어오는 경우
      if (url.startsWith('/uploads/')) return `${SERVER_URL}${url}`;

      // 혹시 상대경로로 들어오면 안전하게 처리
      return url;
    }

    return defaultImg;
  };

  const SENSOR_CONFIG = [
    { id: 'temp', label: '온도', unit: '°C', icon: <FaTemperatureHigh />, color: 'temp' },
    { id: 'humid', label: '습도', unit: '%', icon: <FaTint />, color: 'humid' },
    { id: 'soil', label: '토양 수분', unit: '%', icon: <FaLeaf />, color: 'soil' },
    { id: 'light', label: '조도', unit: 'lx', icon: <FaSun />, color: 'light' },
  ];

  if (sensorLoading && sensorData.temp === 0) {
    return <div className="loading">데이터를 불러오는 중입니다...</div>;
  }

  return (
    <div className="menu-dashboard">
      <section className="dashboard-left">
        <div className="card profile-card">
          <div className="plant-img-box">
            <div className="img-placeholder">
              <img src={getImageSrc(currentPlant.photo_url)} alt="plant" />
            </div>
          </div>

          <div className="plant-info">
            <h2 className='plant-nickname'>{currentPlant.plant_name}</h2>
            <p className="plant-species">{currentPlant.species}</p>
            <p className="status-text">
              현재 상태: {
              currentPlant.status === 'archived' || currentPlant.status === 'dead'
              ? `${currentPlant.death_reason || '원인 미상'}(으)로 사망 ☠️`
              : (sensorData.soil < 30 ? '목마름 💧' : '양호함 😊')}
            </p>
            <div className="growth-day">
              {currentPlant.status === 'archived' || currentPlant.status === 'dead' ?(
              <span style={{color: `#888`}}>
                {(currentPlant.updated_at || currentPlant.updatedAt || new Date().toISOString().split('T')[0])}
                {' '}(떠난지 {calculateDays(currentPlant.updated_at || currentPlant.updatedAt || new Date())}일째)
              </span>
              ):(
              <span>함께한 지 {calculateDays(currentPlant.reg_date)}일째</span>
              )}
            </div>
          </div>
        </div>

        <h3 className="section-title">실시간 환경 데이터</h3>
        <div className="sensor-grid">
          {SENSOR_CONFIG.map((sensor) => (
            <div className="card sensor-card" key={sensor.id}>
              <div className={`icon-box ${sensor.color}`}>{sensor.icon}</div>

              <div
                className={`sensor-value ${
                  sensor.id === 'soil' && sensorData[sensor.id] <= 30 ? 'warning' : ''
                }`}
              >
                {sensorData[sensor.id]} {sensor.unit}
              </div>

              <div className="sensor-label">{sensor.label}</div>
            </div>
          ))}
        </div>

        <h3 className="section-title">주간 성장 리포트</h3>
        <div className="card chart-card">
          <p>📊 그래프가 들어갈 자리입니다 (Chart.js 예정)</p>
        </div>
      </section>

      <section className="dashboard-right">
        <div className="card control-panel">
          <h3>퀵 컨트롤</h3>
          <div className={`mode-toggle-box ${isAutoMode ? 'auto' : 'manual'}`}
          onClick={() => setIsAutoMode(!isAutoMode)}>
            <div className="toggle-label">
              {isAutoMode ? '자동 급수 모드' : '수동 급수 모드'}
            </div>

            <div className="toggle-track">
              <div className="toggle-knob"></div>
            </div>
          </div>
          <p className='mode-desc'>
            {isAutoMode
            ?'AI가 토양 수분을 갑지해 자동으로 물을 줍니다.'
            : '직접 버튼을 눌러 물을 줘야 합니다.'}
          </p>

          <button className='control-btn water-btn'
          disabled={isAutoMode}
          style={{ opacity: isAutoMode ? 0.6 : 1, cursor: isAutoMode ? 'not-allowed' : 'pointer' }}
          onClick={() => Swal.fire('성공', '급수를 완료했습니다.', 'success')}>
            💧 지금 물 주기
          </button>
        </div>

        <div className="card alert-box">
          <h3>🔔 알림</h3>
          <ul className="alert-list">
            {alerts.map((alert) => (
              <li key={alert.id} className={`alert-item ${alert.type}`}>
                {alert.msg}
              </li>
            ))}
          </ul>
        </div>

        <div className="card ai-diagnosis">
          <FaRobot size={30} />
          <p>
            내 식물 아픈 곳은 없을까?
            <br />
            <strong>AI 진단 받기</strong>
          </p>
        </div>
      </section>
    </div>
  );
}

export default Menu;
