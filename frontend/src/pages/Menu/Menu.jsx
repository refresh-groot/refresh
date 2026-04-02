import React, { useState, useEffect } from 'react';
import './Menu.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaTemperatureHigh, FaTint, FaSun, FaLeaf } from 'react-icons/fa';
import { FcSynchronize } from "react-icons/fc";
import { SERVER_URL } from '../../app/constants';
import { useSensorData } from '../../hooks/useSensorData';
import defaultImg from '../../assets/img/default.png';
import Swal from 'sweetalert2';
import PlantChart from './Chart';


function Menu() {
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('soil');
  const [isReLoading, setIsReLoading] = useState(false);

    const [chartData, setChartData] = useState({ // 기본 차트 데이터값 0으로 고정
      soil: [0, 0, 0, 0, 0, 0, 0],               // 연동 후 차트에는 측정된 값이 보일 예정
      temp: [0, 0, 0, 0, 0, 0, 0],
      humid: [0, 0, 0, 0, 0, 0, 0],
      light: [0, 0, 0, 0, 0, 0, 0],
      });

      const fetchChartData = async () => {
        try {
          const response = await fetch(`${SERVER_URL}/api/environment-log/${currentPlant.id}`);
          if (!response.ok) throw new Error('차트 데이터를 불러오지 못했습니다.');

          const data = await response.json();

          const recentLogs = data.slice(-7);

          const NewChartData = {soil: [], temp: [], humid: [], light: []};

          recentLogs.forEach(log => {
            NewChartData.soil.push(log.moisture_level || 0);
            NewChartData.temp.push(log.temperature || 0);
            NewChartData.light.push(log.light_level || 0);
            NewChartData.humid.push(50);
          });

          while (NewChartData.soil.length <7) {
            NewChartData.soil.unshift(0);
            NewChartData.temp.unshift(0);
            NewChartData.light.unshift(0);
            NewChartData.humid.unshift(0);
          }
          setChartData(NewChartData);
          console.log(NewChartData);
        } catch (error) {
          console.error('차트 연동 에러: ', error);
        }
      };

  const [showHistory, setShowHistory] = useState(false);

  const handleReLoading = async () => {
    setIsReLoading(true);
  
    await fetchChartData();
  
    await new Promise((resolve) => setTimeout(resolve, 500));
  
    setIsReLoading(false);
  };
  
  useEffect (() => {
    if(currentPlant && currentPlant.id) {
      fetchChartData();
    }
  },[]);
  

  // 자동 급수 모드 상태 (True: AI 자동 제어, False: 사용자 수동 제어)
  const [isAutoMode, setIsAutoMode] = useState(true);

  // 알림 목록 상태 (추후 백엔드 연동 예정)
  const [alerts] = useState([
    { id: 1, type: 'warning', msg: '물통에 물이 부족합니다!' },
    { id: 2, type: 'success', msg: '오전 09:00 급수 완료' },
  ]);

  // 다른 페이지(목록 등)에서 넘겨받은 식물 데이터
  const receivedPlant = location.state?.plant;

  // 현재 표시할 식물 데이터 초기화
  // 1순위: 넘겨받은 데이터, 2순위: 로컬 스토리지 저장값, 3순위: 기본값
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

  const [wateringHistory, setWateringHistory] = useState([]);
  const [openDateTab, setOpenDateTab] = useState(null);

  const groupedHistory = wateringHistory.reduce((acc,log) => {
    if(!log.watering_date) return acc;
    const date = new Date(log.watering_date);
    const dateKey = `${String(date.getMonth() + 1).padStart(2,'0')}월 ${String(date.getDate()).padStart(2,'0')}일`;

    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(log);
    return acc;
  }, {});

  const formatTimeOnly = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const hours = String(date.getHours()).padStart(2,'0');
    const minutes = String(date.getMinutes()).padStart(2,'0');
    return `${hours}:${minutes}`;
  };

  const fetchWateringHistory = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/api/watering-log/${currentPlant.id}`);
      if(!response.ok) throw new Error('급수 이력을 불러오지 못했습니다.');
      
      const data = await response.json();
      setWateringHistory(data);
    } catch (error) {
      console.error('급수 이력 연동 에러: ', error);
    }
  };

  useEffect (() => {
    if(showHistory && currentPlant?.id) {
      fetchWateringHistory();
    }
  }, [showHistory, currentPlant?.id]);

  const { sensorData: newData, loading: sensorLoading } = useSensorData(currentPlant.id, 600000);

  // 넘겨받은 식물 데이터가 변경되면 현재 상태를 업데이트
  useEffect(() => {
    if (
      receivedPlant &&
      receivedPlant.plant_name !== currentPlant.plant_name
    ) {
      setCurrentPlant(receivedPlant);
    }
  }, [receivedPlant, currentPlant.plant_name]);

  // 새로고침 시에도 데이터가 유지되도록 로컬 스토리지에 현재 식물 정보 저장
  useEffect(() => {
    if (currentPlant) {
      localStorage.setItem('my-plants', JSON.stringify([currentPlant]));
    }
  }, [currentPlant]);

  // 식물 등록일로부터 경과한 날짜(D-Day) 계산 함수
  const calculateDays = (dateString) => {
    if (!dateString) return 0;
    const start = new Date(dateString);
    const today = new Date();
    const diff = today - start;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return days + 1; // 시작일을 1일로 계산
  };

  // 이미지 URL 정규화 함수
  // 서버에서 상대 경로(/uploads/...)로 넘어오는 경우 전체 URL로 변환 처리
  const getImageSrc = (url) => {
    if (!url) return defaultImg;

    if (typeof url === 'string') {
      if (url.startsWith('http')) return url; // 외부 링크
      if (url.startsWith('data:')) return url; // Base64 이미지

      // 백엔드 업로드 경로인 경우 서버 주소 추가
      if (url.startsWith('/uploads/')) return `${SERVER_URL}${url}`;

      return url;
    }

    return defaultImg;
  };

  // 센서 카드 렌더링을 위한 설정 배열 (반복되는 UI를 효율적으로 관리)
  const SENSOR_CONFIG = [
    { id: 'temp', label: '온도', unit: '°C', icon: <FaTemperatureHigh />, color: 'temp' },
    { id: 'humid', label: '습도', unit: '%', icon: <FaTint />, color: 'humid' },
    { id: 'soil', label: '토양 수분', unit: '%', icon: <FaLeaf />, color: 'soil' },
    { id: 'light', label: '조도', unit: 'lx', icon: <FaSun />, color: 'light' },
  ];

  // 센서 데이터 로딩 중 표시
  if (sensorLoading && newData.temp === 0) {
    return <div className="loading">데이터를 불러오는 중입니다...</div>;
  }

  return (
    <div className="menu-dashboard">
      <section className="dashboard-left">
        {/* 식물 프로필 카드 영역 */}
        <div className="card profile-card">
          <div className="plant-img-box">
            <div className="img-placeholder">
              <img src={getImageSrc(currentPlant.photo_url)} alt="plant" />
            </div>
          </div>

          <div className="plant-info">
            <h2 className='plant-nickname'>{currentPlant.plant_name}</h2>
            <p className="plant-species">{currentPlant.species}</p>
            
            {/* 식물 상태 표시: 사망 여부 또는 토양 수분에 따른 상태 텍스트 */}
            <p className="status-text">
              현재 상태: {
              currentPlant.status === 'archived' || currentPlant.status === 'dead'
              ? `${currentPlant.death_reason || '원인 미상'}(으)로 사망 ☠️`
              : (newData.soil < 30 ? '목마름 💧' : '양호함 😊')}
            </p>
            
            {/* 함께한 날짜 표시 */}
            <div className="growth-day">
              {currentPlant.status === 'archived' || currentPlant.status === 'dead' ?(
              <span style={{color: `#888`}}>
                {(currentPlant.updated_at || currentPlant.updatedAt || new Date().toISOString().split('T')[0])}
                {' '}(떠난 지 {calculateDays(currentPlant.updated_at || currentPlant.updatedAt || new Date())}일째)
              </span>
              ):(
              <span>함께한 지 {calculateDays(currentPlant.reg_date)}일째</span>
              )}
            </div>
          </div>
        </div>

        {/* 실시간 센서 데이터 그리드 */}
        <h3 className="section-title">실시간 환경 데이터</h3>
        <div className="sensor-grid">
          {SENSOR_CONFIG.map((sensor) => (
            <div className="card sensor-card" key={sensor.id}>
              <div className={`icon-box ${sensor.color}`}>{sensor.icon}</div>

              {/* 토양 수분이 낮을 경우 경고 스타일 적용 */}
              <div
                className={`sensor-value ${
                  sensor.id === 'soil' && newData[sensor.id] <= 30 ? 'warning' : ''
                }`}
              >
                {newData[sensor.id]} {sensor.unit}
              </div>

              <div className="sensor-label">{sensor.label}</div>
            </div>
          ))}
        </div>

        {/* 성장 리포트 차트 영역 (Chart.js 연동 예정) */}
        <h3 className="section-title">주간 성장 리포트</h3>
        <div className="card chart-card">
          <div className="chart-controls-container">
          <div className='tab-buttons'>
            {['soil', 'temp', 'humid', 'light'].map(id => (
              <button
              key = {id}
              className={activeTab === id ? 'active' : ''}
              onClick={() => setActiveTab(id)}>
                {id === 'soil' ? '토양수분' : id === 'temp' ? '온도' : id === 'humid' ? '습도' : '조도'}
              </button>
            ))}
          </div>
          <button
      className={`Chart-btn ${isReLoading ? 'loading' : ''}`}
      onClick={handleReLoading}
      disabled={isReLoading}
      >
        {isReLoading ? '갱신중' : <FcSynchronize />}
      </button>
          </div>
          <div className='chart-wrapper'>
            <PlantChart
            activeTab={activeTab}
            dataList={chartData[activeTab]}
            />
          </div>
        </div>
        
      </section>

      <section className="dashboard-right">
        {/* 제어 패널: 자동/수동 모드 및 급수 버튼 */}
        <div className="card control-panel">
          <h3>퀵 컨트롤</h3>
          
          {/* 모드 전환 토글 버튼 */}
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
            ? 'AI가 토양 수분을 감지해 자동으로 물을 줍니다.'
            : '직접 버튼을 눌러 물을 줘야 합니다.'}
          </p>

          {/* 수동 급수 버튼: 자동 모드일 경우 비활성화 처리 */}
          <div className="quick-btn">
          <button className='control-btn water-btn'
          disabled={isAutoMode}
          style={{ opacity: isAutoMode ? 0.6 : 1, cursor: isAutoMode ? 'not-allowed' : 'pointer' }}
          onClick={() => Swal.fire('성공', '급수를 완료했습니다.', 'success')}>
            급수
          </button>
          <button 
            className='water-history-btn'
            onClick={() => setShowHistory(!showHistory)}>
              {showHistory ? '알림 보기' : '급수 이력'}
              </button>
          </div>
        </div>

        {showHistory ? (
          <div className="history-list">
              {Object.keys(groupedHistory).length > 0 ? (
                Object.entries(groupedHistory).map(([dateKey, logs]) => (
                  <div className="history-group" key={dateKey}>
                  <div 
                    className={`group-header ${openDateTab === dateKey ? 'open' : ''}`}
                    onClick={() => setOpenDateTab(openDateTab === dateKey ? null : dateKey)}
                  >
                    <span className="group-date">{dateKey} ({logs.length}건)</span>
                    <span className="group-arrow">{openDateTab === dateKey ? '▲' : '▼'}</span>
                  </div>
                  {openDateTab === dateKey && (
                  <div className="group-content">
                    {logs.map((log) => (
                    <div className="history-item" key={log.id}>
                      <span className='time'>{formatTimeOnly(log.watering_date)}</span>
                      <span className={`status ${log.is_auto ? 'auto' : 'manual'}`}>
                      {log.is_auto ? '자동 급수' : '수동 급수'}
                      <span style={{ fontSize: '0.85em', color: '#888', marginLeft: '4px' }}>
                      ({log.duration_sec}초)
                      </span>
                      </span>
                      </div>
                      ))}
                  </div>
                  )}
                  </div>
                ))
              ) : (
                <div className="history-item" style={{ justifyContent: 'center', color: '#999', border: 'none' }}>
                  최근 급수 이력이 없습니다. 🌱
                </div>
              )}
            </div>
          
        ) : (
          <>
            {/* 알림 목록 영역 */}
            <div className="card alert-box">
              <h3>알림</h3>
              <ul className="alert-list">
                {alerts.map((alert) => (
                  <li key={alert.id} className={`alert-item ${alert.type}`}>
                    {alert.msg}
                  </li>
                ))}
              </ul>
            </div>

            {/* AI 진단 페이지 이동 카드 */}
            <div className="card ai-diagnosis"
            onClick={() => navigate('/Chat', { state: { plant: currentPlant } })}
            style={{ cursor: 'pointer' }}>
              
              <p>
                내 식물 아픈 곳은 없을까?
                <br />
                <strong>AI 진단 받기</strong>
              </p>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export default Menu;