import React, { useState, useEffect, useCallback } from 'react';
import './Menu.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaTemperatureHigh, FaTint, FaSun, FaLeaf, FaChevronDown, FaChevronUp, FaHistory } from 'react-icons/fa';
import { FcSynchronize } from "react-icons/fc";
import { SERVER_URL } from '../../app/constants';
import { useSensorData } from '../../hooks/useSensorData';
import defaultImg from '../../assets/img/default.png';
import PlantChart from './Chart';
import { showToast } from '../../app/alert';
import { useBluetooth } from '../../context/BluetoothContext';
import api from '../../api/axios'; // 동료 추가

function Menu() {
  const location = useLocation();
  const navigate = useNavigate();

  // 동료 추가: 상태 변수
  const [isAlertOn, setIsAlertOn] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  const [activeTab, setActiveTab] = useState('soil');
  const [isReLoading, setIsReLoading] = useState(false);
  const [statsData, setStatsData] = useState({});
  const [showWaterModal, setShowWaterModal] = useState(false);
  const [waterDuration, setWaterDuration] = useState(5);
  const [showHistory, setShowHistory] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [wateringHistory, setWateringHistory] = useState([]);
  const [openDateTab, setOpenDateTab] = useState(null);
  
  
  // 동료 추가: isConnected 대신 deviceName 사용
  const { sendCommand, sensorData: btSensorData, isAutoMode, setIsAutoMode, pumpRate, deviceName } = useBluetooth();

  const receivedPlant = location.state?.plant;
  const [currentPlant, setCurrentPlant] = useState(() => {
    if (receivedPlant) return receivedPlant;
    const saved = localStorage.getItem('my-plants');
    const parsed = saved ? JSON.parse(saved) : [];
    return parsed.length > 0 ? parsed[0] : {
      plant_name: '식물을 등록해주세요',
      species: '식물 종류',
      reg_date: new Date().toISOString().split('T')[0],
      photo_url: defaultImg,
      status: 'active',
    };
  });

  const fetchChartData = useCallback(async () => {
    if (!currentPlant?.id) return;
    try {
      const response = await fetch(`${SERVER_URL}/api/environment-log/stats/${currentPlant.id}`);
      if (!response.ok) throw new Error('차트 데이터를 불러오지 못했습니다.');
      const data = await response.json();
      setStatsData(data);
    } catch (error) {
      console.error('차트 연동 에러: ', error);
    }
  }, [currentPlant?.id]);

  const fetchWateringHistory = useCallback(async () => {
    if (!currentPlant?.id) return;
    try {
      const response = await fetch(`${SERVER_URL}/api/watering-log/${currentPlant.id}`);
      if (!response.ok) throw new Error('급수 이력을 불러오지 못했습니다.');
      const data = await response.json();
      setWateringHistory(data);
    } catch (error) {
      console.error('급수 이력 연동 에러: ', error);
    }
  }, [currentPlant?.id]);

  // 동료 추가: 알림 설정 및 조회 폴링
  useEffect(() => {
    const fetchAlertSetting = async () => {
      try {
        const res = await api.get('/api/user/profile');
        setIsAlertOn(res.data.isAlertOn || false);
      } catch (e) {
        console.error('알림 설정 불러오기 실패:', e);
      }
    };
    fetchAlertSetting();
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!currentPlant?.id) return;
    try {
      const res = await api.get(`/api/notifications/${currentPlant.id}`);
      setNotifications(res.data);
    } catch (e) {
      console.error('알림 조회 실패:', e);
    }
  }, [currentPlant?.id]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); 
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleReLoading = async () => {
    setIsReLoading(true);
    await fetchSensorData();
    await fetchChartData();
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsReLoading(false);
  };

  useEffect(() => {
    if (currentPlant?.id) {
      fetchChartData();
    }
  }, [fetchChartData]);

  useEffect(() => {
    const handler = () => {
      fetchWateringHistory();
      fetchChartData();
    };
    window.addEventListener('wateringDone', handler);
    return () => window.removeEventListener('wateringDone', handler);
  }, [fetchWateringHistory, fetchChartData]);

  const handleModeToggle = async () => {
    const nextMode = !isAutoMode;
    setIsAutoMode(nextMode);

    if (!sendCommand) {
      showToast('error', '블루투스 기기가 연결되지 않았습니다.');
      setIsAutoMode(!nextMode); 
      return;
    }

    try {
      if (nextMode) {
        await sendCommand('MODE:AUTO');
        showToast('success', '자동 모드로 전환되었습니다.');
      } else {
        await sendCommand('MODE:MANUAL');
        showToast('success', '수동 모드로 전환되었습니다.');
        setShowWaterModal(true);
      }
    } catch (error) {
      showToast('error', '모드 전환에 실패했습니다.');
      setIsAutoMode(!nextMode);
    }
  };

  const handleWatering = async () => {
    setShowWaterModal(false);
    if (!sendCommand) {
      showToast('error', '블루투스 기기가 연결되지 않았습니다.');
      return;
    }
    try {
      await sendCommand(`WATER ${Math.round(waterDuration * pumpRate)}`);
      const response = await fetch(`${SERVER_URL}/api/watering-log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plant_id: currentPlant.id,
          is_auto: false,
          duration_sec: waterDuration
        })
      });
      if (!response.ok) throw new Error('급수 실패');
      showToast('success', `${waterDuration}초 급수를 시작했습니다.`);
      fetchWateringHistory();
      fetchChartData();
    } catch (error) {
      showToast('error', '급수에 실패했습니다.');
    }
  };

  const getRecent10DaysHistory = () => {
    const tempGroup = {};
    const today = new Date();
    for (let i = 0; i < 10; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = `${String(d.getMonth() + 1).padStart(2, '0')}월 ${String(d.getDate()).padStart(2, '0')}일`;
      tempGroup[key] = [];
    }
    wateringHistory.forEach(log => {
      const logDate = new Date(log.watering_date);
      const key = `${String(logDate.getMonth() + 1).padStart(2, '0')}월 ${String(logDate.getDate()).padStart(2, '0')}일`;
      if (tempGroup[key]) tempGroup[key].push(log);
    });
    return Object.keys(tempGroup).filter(key => tempGroup[key].length > 0);
  };

  const historyKeys = getRecent10DaysHistory();
  const displayKeys = showAllHistory ? historyKeys : historyKeys.slice(0, 3);

  useEffect(() => {
    if (showHistory && currentPlant?.id) {
      fetchWateringHistory();
    }
  }, [showHistory, fetchWateringHistory]);

  const { sensorData: serverData, loading: sensorLoading, fetchData: fetchSensorData } = useSensorData(currentPlant.id, 600000);

const newData = {
    temp: btSensorData?.temp ?? serverData?.temp ?? null,
    humid: btSensorData?.humid ?? serverData?.humid ?? null,
    soil: btSensorData?.soil ?? serverData?.soil ?? null,
    light: btSensorData?.light ?? serverData?.light ?? null,
  };

  useEffect(() => {
    if (receivedPlant && receivedPlant.plant_name !== currentPlant.plant_name) {
      setCurrentPlant(receivedPlant);
    }
  }, [receivedPlant, currentPlant.plant_name]);

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
    return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  const getImageSrc = (url) => {
    if (!url) return defaultImg;
    if (typeof url === 'string') {
      if (url.startsWith('http') || url.startsWith('data:')) return url;
      if (url.startsWith('/uploads/')) return `${SERVER_URL}${url}`;
    }
    return defaultImg;
  };

  const formatTimeOnly = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  // Sensor Config 수정
  const SENSOR_CONFIG = [
    { id: 'temp', label: '온도', unit: '°C', icon: <FaTemperatureHigh />, color: 'temp' },
    { id: 'humid', label: '물 잔량', unit: '%', icon: <FaTint />, color: 'humid' },
    { id: 'soil', label: '토양 수분', unit: '%', icon: <FaLeaf />, color: 'soil' },
    { id: 'light', label: '조도', unit: 'lx', icon: <FaSun />, color: 'light' },
  ];

  const goToSetting = () => {
    navigate('/setting', { state: { plant: currentPlant } }); 
  };

  if (sensorLoading && newData.temp === null && !btSensorData) {
    return <div className="loading">데이터를 불러오는 중입니다...</div>;
  }

  // 동료 추가: 상태 텍스트
  const getStatusText = () => '기기 연결됨';

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
                    <h2 className='plant-nickname'>
                {currentPlant.plant_name}
                <span 
                    onClick={goToSetting} 
                    style={{ cursor: 'pointer', marginLeft: '10px', fontSize: '18px' }}
                    title="기기 설정"
                >
                    ⚙️
                </span>
            </h2>
            <p className="plant-species">{currentPlant.species}</p>
            <p className="status-text">
              현재 상태: {getStatusText()}
            </p>
            <div className="growth-day">함께한 지 {calculateDays(currentPlant.reg_date)}일째</div>
          </div>
        </div>

        <h3 className="section-title">실시간 환경 데이터</h3>
        <div className="sensor-grid">
          {SENSOR_CONFIG.map((sensor) => (
            <div className="card sensor-card" key={sensor.id}>
              <div className={`icon-box ${sensor.color}`}>{sensor.icon}</div>
              <div className={`sensor-value ${sensor.id === 'soil' && newData[sensor.id] <= 30 ? 'warning' : ''}`}>
                {newData[sensor.id] !== null ? `${newData[sensor.id]} ${sensor.unit}` : '--'}
              </div>
              <div className="sensor-label">{sensor.label}</div>
            </div>
          ))}
        </div>

        <h3 className="section-title">주간 성장 리포트</h3>
        <div className="card chart-card">
          <div className="chart-controls-container">
            <div className='tab-buttons'>
              {['soil', 'temp', 'light'].map(id => (
                <button key={id} className={activeTab === id ? 'active' : ''} onClick={() => setActiveTab(id)}>
                  {id === 'soil' ? '토양수분' : id === 'temp' ? '온도' : '조도'}
                </button>
              ))}
            </div>
            <button className={`Chart-btn ${isReLoading ? 'loading' : ''}`} onClick={handleReLoading}>
              {isReLoading ? '갱신중' : <FcSynchronize />}
            </button>
          </div>
          <div className='chart-wrapper'>
            <PlantChart activeTab={activeTab} statsData={statsData} />
          </div>
        </div>
      </section>

      <section className="dashboard-right">
        <div className="card control-panel">
          <h3>급수 제어</h3>
          <div className={`mode-toggle-box ${isAutoMode ? 'auto' : 'manual'}`} onClick={handleModeToggle}>
            <div className="toggle-label">{isAutoMode ? '자동 모드' : '수동 모드'}</div>
            <div className="toggle-track"><div className="toggle-knob"></div></div>
          </div>
          <div className="control-btns">
            <button className='control-btn water-btn' disabled={isAutoMode} onClick={() => setShowWaterModal(true)}>급수</button>
            <button className='water-history-btn' onClick={() => { setShowHistory(!showHistory); setShowAllHistory(false); }}>
              {showHistory ? '알림 보기' : '급수 이력'}
            </button>
          </div>
        </div>

        {!showHistory ? (
          <>
            <div className="card alert-box">
      <h3>알림</h3>
      {!isAlertOn ? (
      <ul className="alert-list">
        <li className="alert-item">
          알림이 꺼져 있습니다.{' '}
          <span
          onClick={goToSetting}
          style={{ color: '#2ecc71', cursor: 'pointer', fontWeight: '600' }}
          >
          설정에서 켜기 →
            </span>
            </li>
            </ul>
            ) : (
            <ul className="alert-list">
      {notifications.filter(n => n.type === 'ERROR').slice(0, 5).length > 0 ? (
      notifications
      .filter(n => n.type === 'ERROR')
      .slice(0, 5)
      .map((n, idx) => {
        const isDanger = n.message.includes('0%') || n.message.includes('저온') || n.message.includes('위험');
        return (
          <li key={idx} className={`alert-item ${isDanger ? 'danger' : 'warning'}`}>
          <div className="alert-content">
          <span className="alert-text">{n.message}</span>
          </div>
          <span className="alert-time">
            {new Date(n.createdAt).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}
            {' '}
            {formatTimeOnly(n.createdAt)}
          </span>
          </li>
          );
          })
          ) : (
          <li className="alert-item empty">현재 알림이 없습니다.</li>
          )}
          </ul>
            )}
          </div>
            <div className="card ai-diagnosis" onClick={() => navigate('/Chat', { state: { plant: currentPlant } })} style={{ cursor: 'pointer' }}>
              <p>내 식물 아픈 곳은 없을까?<br /><strong>AI 진단 받기</strong></p>
            </div>
          </>
        ) : (
          <div className="history-list">
            {historyKeys.length > 0 ? (
              <>
                {displayKeys.map((dateKey) => (
                  <div className="history-group" key={dateKey}>
                    <div className={`group-header ${openDateTab === dateKey ? 'open' : ''}`} onClick={() => setOpenDateTab(openDateTab === dateKey ? null : dateKey)}>
                      <span className="group-date">{dateKey} ({wateringHistory.filter(l => {
                        const d = new Date(l.watering_date);
                        return `${String(d.getMonth() + 1).padStart(2, '0')}월 ${String(d.getDate()).padStart(2, '0')}일` === dateKey;
                      }).length}건)</span>
                      <span className="group-arrow">{openDateTab === dateKey ? <FaChevronUp /> : <FaChevronDown />}</span>
                    </div>
                    {openDateTab === dateKey && (
                      <div className="group-content">
                        {wateringHistory.filter(l => {
                          const d = new Date(l.watering_date);
                          return `${String(d.getMonth() + 1).padStart(2, '0')}월 ${String(d.getDate()).padStart(2, '0')}일` === dateKey;
                        }).map((log) => (
                          <div className="history-item" key={log.id}>
                            <span className='time'>{formatTimeOnly(log.watering_date)}</span>
                            <span className={`status ${log.is_auto ? 'auto' : 'manual'}`}>
                              {log.is_auto ? '자동' : '수동'} ({log.duration_sec}초)
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {historyKeys.length > 3 && (
                  <button className="view-more-history" onClick={() => setShowAllHistory(!showAllHistory)}>
                    <FaHistory style={{ marginRight: '6px' }} />
                    {showAllHistory ? '이력 접기' : '최근 10일 기록 더보기'}
                  </button>
                )}
              </>
            ) : <div className="history-empty">최근 10일간 기록 없음</div>}
          </div>
        )}
      </section>

      {showWaterModal && (
        <div className="modal-overlay" onClick={() => setShowWaterModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowWaterModal(false)}>✕</button>
            <h2>급수 시간 설정</h2>
            <div className="duration-selector">
              <button onClick={() => setWaterDuration(d => Math.max(1, d - 1))}>−</button>
              <span>{waterDuration}초</span>
              <button onClick={() => setWaterDuration(d => Math.min(60, d + 1))}>+</button>
            </div>
            <button className="modal-submit-btn" onClick={handleWatering}>급수 시작</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Menu;