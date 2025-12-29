import React, {  useState } from 'react';
import './Menu.css';
import { FaTemperatureHigh, FaTint, FaSun, FaLeaf, FaRobot } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { SERVER_URL } from '../../app/constants';
import { useSensorData } from '../../hooks/useSensorData';
import roseImage from '../../assets/img/rose.png';

function Menu() {

  const {user} = useAuth();
  const {sensorData, loading: sensorLoading} = useSensorData(5000);
  const [isAutoMode, setIsAutoMode] =useState(true);

  const [plantProfile] = useState({
    name: "장미",
    status: "현재 상태: 양호함",
    days: 24,
    img: roseImage
  });

  const [alerts] =useState([{
  id: 1, type: 'warning', msg: "물통에 물이 부족합니다!"},
  {id: 2, type: 'success', msg: "오전 09:00 급수 완료"
  }]);

  const SENSOR_CONFIG = [
    { id: 'temp', label: '온도', unit: '°C', icon: <FaTemperatureHigh />, color: 'temp' },
    { id: 'humid', label: '습도', unit: '%', icon: <FaTint />, color: 'humid' },
    { id: 'soil', label: '토양 수분', unit: '%', icon: <FaLeaf />, color: 'soil' },
    { id: 'light', label: '조도', unit: 'lx', icon: <FaSun />, color: 'light' },
  ];

  if( sensorLoading && sensorData.temp === 0){
    return <div className="loading">데이터를 불러오는 중입니다...</div>;
  }

  return (
    <div className="menu-dashboard">
      
      <section className="dashboard-left">
        <div className="card profile-card">
          <div className="plant-img-box">
</div>
            <div className="img-placeholder">
              <img src = {plantProfile.img} alt = "rose"/>
          </div>
          <div className="plant-info">
            <h2>{user?.nickname}</h2>
            <p className="status-text">{plantProfile.status}</p>
            <div className="growth-day">함께한 지 {plantProfile.days}일째</div>
          </div>
        </div>
        
        <h3 className="section-title">실시간 환경 데이터</h3>
        <div className="sensor-grid">
          {SENSOR_CONFIG.map((sensor) => (
            <div className="card sensor-card" key={sensor.id}>
              <div className={`icon-box ${sensor.color}`}>
                {sensor.icon}
              </div>
              
              <div className={`sensor-value ${sensor.id === 'soil' && sensorData[sensor.id] <= 30 ? 'warning' : ''}`}>
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
            <button className="control-btn water-btn">💧 물 주기 {isAutoMode ? '(자동)' : '(수동)'}</button>
            <div className="toggle-box">
                <span>자동 급수 모드</span>
                <input 
                  type="checkbox" 
                  id="auto-mode" 
                  checked={isAutoMode} 
                  onChange={() => setIsAutoMode(!isAutoMode)} 
                />
                <label htmlFor="auto-mode" className="toggle-label"></label>
            </div>
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
            <p>내 식물 아픈 곳은 없을까?<br/><strong>AI 진단 받기</strong></p>
        </div>

      </section>

    </div>

  );
}

export default Menu;