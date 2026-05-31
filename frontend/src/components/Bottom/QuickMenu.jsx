import React, { useState } from 'react';
import { useBluetooth } from '../../context/BluetoothContext';
import { useNavigate } from 'react-router-dom';
import './QuickMenu.css';
import { IoWaterOutline } from "react-icons/io5";
import { FaStop, FaHandPaper, FaWifi, FaExclamationTriangle } from "react-icons/fa";
import { MdAutorenew, MdTune } from "react-icons/md";
import { BsFileBarGraph } from "react-icons/bs";
import { IoIosSettings } from "react-icons/io";
import { PiPlant } from "react-icons/pi";
import { showToast } from '../../app/alert';
import { SERVER_URL } from '../../app/constants';
import api from '../../api/axios';
import defaultImg from '../../assets/img/default.png';

const MENU = [
  {
    icon: <IoWaterOutline />,
    name: '급수제어',
    color: '#3b82f6',
    children: [
      { icon: <IoWaterOutline />, name: '급수', special: 'water' },
      { icon: <FaStop />, name: '정지', cmd: 'STOP' },
      { icon: <MdAutorenew />, name: '자동모드', cmd: 'MODE:AUTO' },
      { icon: <FaHandPaper />, name: '수동모드', cmd: 'MODE:MANUAL' },
    ],
  },
  {
    icon: <BsFileBarGraph />,
    name: '상태확인',
    color: '#10b981',
    cmd: 'STATE',
  },
  {
    icon: <IoIosSettings />,
    name: '기기설정',
    color: '#f59e0b',
    children: [
      { icon: <PiPlant />, name: '식물설정', special: 'plant' },
      { icon: <FaWifi />, name: '와이파이', special: 'wifi' },
      { icon: <MdTune />, name: '펌프보정', special: 'cal' },
    ],
  },
];

const PARENT_RADIUS = 90;
const CHILD_RADIUS = 100;

function getFanPositions(count) {
  const total = 160;
  const start = 180 + (180 - total) / 2;
  return Array.from({ length: count }, (_, i) => {
    const angle = count === 1 ? 270 : start + (total / (count - 1)) * i;
    const rad = (angle * Math.PI) / 180;
    return {
      x: Math.cos(rad) * PARENT_RADIUS,
      y: Math.sin(rad) * CHILD_RADIUS,
    };
  });
}

const QuickMenu = ({ onClose, currentPlant }) => {
  const { sendCommand, deviceName, isAutoMode, setIsAutoMode, pumpRate, setPumpRate } = useBluetooth();
  const [activeParent, setActiveParent] = useState(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [showWaterModal, setShowWaterModal] = useState(false);
  const [showModeConfirmModal, setShowModeConfirmModal] = useState(false);
  const [showWifiModal, setShowWifiModal] = useState(false);
  const [showPlantModal, setShowPlantModal] = useState(false);
  const [showCalModal, setShowCalModal] = useState(false);
  const [waterDuration, setWaterDuration] = useState(5);
  const [wifiSSID, setWifiSSID] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [plantList, setPlantList] = useState([]);
  const [plantLoading, setPlantLoading] = useState(false);
  const [calValue, setCalValue] = useState(pumpRate);
  const navigate = useNavigate();

  const fetchPlantList = async () => {
    setPlantLoading(true);
    try {
      const res = await api.get('/api/plants');
      setPlantList(res.data);
    } catch (error) {
      console.error('식물 목록 불러오기 실패:', error);
      showToast('error', '식물 목록을 불러오지 못했습니다.');
    } finally {
      setPlantLoading(false);
    }
  };

  const getImageSrc = (url) => {
    if (!url) return defaultImg;
    if (typeof url === 'string') {
      if (url.startsWith('http') || url.startsWith('data:')) return url;
      if (url.startsWith('/uploads/')) return `${SERVER_URL}${url}`;
    }
    return defaultImg;
  };

  const handlePlantSelect = async (plant) => {
    try {
      localStorage.setItem('my-plants', JSON.stringify([plant]));
      if (sendCommand && deviceName) {
        await sendCommand(`PLANT:${plant.species}`);
      }
      showToast('success', `${plant.plant_name}으로 전환되었습니다.`);
      setShowPlantModal(false);
      onClose();
      navigate('/menu', { state: { plant } });
    } catch (error) {
      console.error('식물 전환 실패:', error);
      showToast('error', '식물 전환에 실패했습니다.');
    }
  };

  const handleParent = (item, idx) => {
    if (item.cmd) {
      execCommand(item.cmd, item.name);
      return;
    }
    setActiveParent(activeParent === idx ? null : idx);
  };

  // [연타 방지를 위한 문지기 변수 선언]
  const [isSending, setIsSending] = useState(false);

  const execCommand = async (cmd, name) => {
    if (!deviceName || !sendCommand) {
      setIsAlertOpen(true);
      return;
    }
    if (isSending) return; // 이미 명령어가 날아가는 중이면 사용자의 클릭을 무시하고 차단합니다.

    try {
      setIsSending(true); // 통신 시작과 동시에 버튼을 잠금 상태로 만듭니다.
      await sendCommand(cmd);
      if (cmd === 'MODE:AUTO') setIsAutoMode(true);
      if (cmd === 'MODE:MANUAL') setIsAutoMode(false);
      showToast('success', `${name} 명령을 전송했습니다.`);
      onClose();
    } catch (error) {
      console.error('명령 전송 실패:', error);
      showToast('error', '명령 전송에 실패했습니다.');
    } finally {
      setIsSending(false); // 전송이 성공하든 에러가 나든 처리가 끝나면 다시 버튼 잠금을 해제합니다.
    }
  };

  const handleWatering = async () => {
    if (!deviceName || !sendCommand) {
      setIsAlertOpen(true);
      return;
    }
    try {
      await sendCommand(`WATER ${Math.round(waterDuration * pumpRate)}`); //await sendCommand(`WATER ${waterDuration}`);
      showToast('success', `${waterDuration}초 급수를 시작했습니다.`);
      if (currentPlant?.id) {
        await fetch(`${SERVER_URL}/api/watering-log`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plant_id: currentPlant.id,
            is_auto: false,
            duration_sec: waterDuration
          })
        });
        window.dispatchEvent(new CustomEvent('wateringDone'));
      }
      setShowWaterModal(false);
      onClose();
    } catch (error) {
      console.error('급수 실패:', error);
      showToast('error', '급수에 실패했습니다.');
    }
  };

  const handleWifiConnect = async () => {
    if (!wifiSSID.trim()) {
      showToast('error', 'SSID를 입력해주세요.');
      return;
    }
    try {
      await sendCommand(`WIFI:${wifiSSID},${wifiPassword}`);
      showToast('success', 'Wi-Fi 정보를 전송했습니다. ESP32가 재부팅됩니다.');
      setShowWifiModal(false);
      setWifiSSID('');
      setWifiPassword('');
      onClose();
    } catch (error) {
      showToast('error', 'Wi-Fi 설정 전송에 실패했습니다.');
    }
  };

  const handleCal = async () => {
    if (!calValue || calValue <= 0) {
      showToast('error', '올바른 값을 입력해주세요.');
      return;
    }
    try {
      await sendCommand(`CAL ${calValue}`);
      setPumpRate(calValue);
      showToast('success', `펌프 보정값이 ${calValue}ml/초로 설정되었습니다.`);
      setShowCalModal(false);
      onClose();
    } catch (error) {
      showToast('error', '펌프 보정 전송에 실패했습니다.');
    }
  };

  const handleChild = async (item) => {
    if (item.special === 'water') {
      if (!deviceName || !sendCommand) {
        setIsAlertOpen(true);
        return;
      }
      if (isAutoMode) {
        setShowModeConfirmModal(true);
        return;
      }
      setShowWaterModal(true);
      return;
    }
    if (item.special === 'wifi') {
      if (!deviceName || !sendCommand) {
        setIsAlertOpen(true);
        return;
      }
      setShowWifiModal(true);
      return;
    }
    if (item.special === 'plant') {
    setPlantLoading(true);
    try {
      const res = await api.get('/api/plants');
      const data = res.data;
      if (Array.isArray(data)) {
        setPlantList(data);
      } else if (data?.plants) {
        setPlantList(data.plants);
      } else {
        setPlantList([]);
      }
    } catch (error) {
      showToast('error', '식물 목록을 불러오지 못했습니다.');
    } finally {
      setPlantLoading(false);
    }
    setShowPlantModal(true);  // fetch 완전히 끝난 후 모달 열기
    return;
  }
    if (item.special === 'cal') {
      if (!deviceName || !sendCommand) {
        setIsAlertOpen(true);
        return;
      }
      setCalValue(pumpRate);
      setShowCalModal(true);
      return;
    }
    execCommand(item.cmd, item.name);
  };

  const parentPositions = getFanPositions(MENU.length);
  const childItems = activeParent !== null ? MENU[activeParent].children : [];
  const childPositions = getFanPositions(childItems?.length || 0);

  return (
    <>
      <div className="qm-overlay" onClick={() => { setActiveParent(null); onClose(); }}>
        <div className="qm-badge" onClick={e => e.stopPropagation()}>
          <span className={`qm-dot ${deviceName ? 'connected' : ''}`} />
          {deviceName ? deviceName : '기기 미연결'}
        </div>

        <div className="qm-fan" onClick={e => e.stopPropagation()}>
          {MENU.map((item, i) => {
            const { x, y } = parentPositions[i];
            const isActive = activeParent === i;
            const isAnyActive = activeParent !== null;
            if (isAnyActive && !isActive) return null;
            return (
              <button
                key={i}
                className={`qm-item qm-parent ${isActive ? 'active' : ''}`}
                style={{
                  '--tx': `${x}px`,
                  '--ty': `${y}px`,
                  '--accent': item.color,
                  '--delay': `${i * 0.05}s`,
                }}
                onClick={() => handleParent(item, i)}
              >
                <span className="qm-icon">{item.icon}</span>
                <span className="qm-label">{item.name}</span>
              </button>
            );
          })}

          {activeParent !== null && childItems.map((item, i) => {
            const { x, y } = childPositions[i];
            return (
              <button
                key={`child-${i}`}
                className="qm-item qm-child"
                style={{
                  '--tx': `${x}px`,
                  '--ty': `${y}px`,
                  '--delay': `${i * 0.05}s`,
                  '--accent': MENU[activeParent].color,
                }}
                onClick={() => handleChild(item)}
              >
                <span className="qm-icon">{item.icon}</span>
                <span className="qm-label">{item.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 식물 선택 모달 */}
      {showPlantModal && (
        <div className="modal-overlay" style={{ zIndex: 3000 }} onClick={() => setShowPlantModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowPlantModal(false)}>✕</button>
            <h2>식물 선택</h2>
            {plantLoading ? (
              <p style={{ textAlign: 'center', color: '#888', padding: '20px' }}>불러오는 중...</p>
            ) : plantList.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#888', padding: '20px' }}>등록된 식물이 없습니다.</p>
            ) : (
              <div style={{ maxHeight: '300px', overflowY: 'auto', marginTop: '10px' }}>
                {plantList.map((plant) => (
                  <div
                    key={plant.id}
                    onClick={() => handlePlantSelect(plant)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      border: currentPlant?.id === plant.id ? '2px solid #4caf50' : '1px solid #eee',
                      marginBottom: '8px',
                      background: currentPlant?.id === plant.id ? '#f0faf0' : 'white',
                      transition: 'all 0.15s'
                    }}
                  >
                    <img
                      src={getImageSrc(plant.photo_url)}
                      alt={plant.plant_name}
                      style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div style={{textAlign: 'left' }}>
                      <div style={{ fontWeight: '600', fontSize: '15px', color: '#333' }}>{plant.plant_name}</div>
                      <div style={{ fontSize: '13px', color: '#888' }}>{plant.species}</div>
                    </div>
                    {currentPlant?.id === plant.id && (
                      <span style={{ marginLeft: 'auto', color: '#4caf50', fontWeight: '600', fontSize: '13px' }}>현재</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 급수 시간 설정 모달 */}
      {showWaterModal && (
        <div className="modal-overlay" style={{ zIndex: 3000 }} onClick={() => setShowWaterModal(false)}>
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

      {/* 자동모드 → 수동모드 전환 확인 모달 */}
      {showModeConfirmModal && (
        <div className="modal-overlay" style={{ zIndex: 3000 }}>
          <div className="modal-content">
            <button className="close-btn" onClick={() => setShowModeConfirmModal(false)}>✕</button>
            <h2>모드 전환</h2>
            <p style={{ textAlign: 'center', color: '#888', fontSize: '14px', marginBottom: '24px' }}>
              현재 자동모드입니다.<br />수동모드로 전환 후 급수하시겠습니까?
            </p>
            <div className="modal-btns">
              <button className="modal-cancel-btn" onClick={() => setShowModeConfirmModal(false)}>취소</button>
              <button
                className="modal-confirm-btn green"
                onClick={async () => {
                  try {
                    await sendCommand('MODE:MANUAL');
                    setIsAutoMode(false);
                    setShowModeConfirmModal(false);
                    setShowWaterModal(true);
                  } catch (error) {
                    showToast('error', '모드 전환에 실패했습니다.');
                  }
                }}
              >
                전환 후 급수
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 와이파이 설정 모달 */}
      {showWifiModal && (
        <div className="modal-overlay" style={{ zIndex: 3000 }} onClick={() => setShowWifiModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowWifiModal(false)}>✕</button>
            <h2>Wi-Fi 설정</h2>
            <p style={{ textAlign: 'center', color: '#888', fontSize: '13px', marginBottom: '20px' }}>
              2.4GHz Wi-Fi만 지원됩니다.
            </p>
            <div className="modal-input-group">
              <label>Wi-Fi 이름 (SSID)</label>
              <input
                type="text"
                placeholder="Wi-Fi 이름을 입력하세요"
                value={wifiSSID}
                onChange={e => setWifiSSID(e.target.value)}
              />
            </div>
            <div className="modal-input-group">
              <label>비밀번호</label>
              <input
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={wifiPassword}
                onChange={e => setWifiPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleWifiConnect()}
              />
            </div>
            <button className="modal-submit-btn" onClick={handleWifiConnect}>연결하기</button>
          </div>
        </div>
      )}

      {/* 펌프 보정 모달 */}
      {showCalModal && (
        <div className="modal-overlay" style={{ zIndex: 3000 }} onClick={() => setShowCalModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowCalModal(false)}>✕</button>
            <h2>펌프 보정</h2>
            <p style={{ textAlign: 'center', color: '#888', fontSize: '13px', marginBottom: '20px' }}>
              펌프의 초당 토출량(ml)을 입력하세요.
            </p>
            <div className="modal-input-group">
              <label>토출량 (ml/초)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={calValue}
                onChange={e => setCalValue(parseFloat(e.target.value))}
              />
            </div>
            <button className="modal-submit-btn" onClick={handleCal}>보정 적용</button>
          </div>
        </div>
      )}

      {/* 블루투스 미연결 모달 */}
      {isAlertOpen && (
        <div className="modal-overlay" style={{ zIndex: 3000 }}>
          <div className="modal-content" style={{ maxWidth: '320px', padding: '30px' }}>
            <div className="modal-header" style={{ textAlign: 'center', marginBottom: '20px' }}>
              <FaExclamationTriangle style={{ fontSize: '40px', color: '#ff9f43', marginBottom: '15px' }} />
              <h2 style={{ fontSize: '20px', color: '#333' }}>기기 미연결</h2>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', marginBottom: '25px' }}>
              <p style={{ fontSize: '15px', color: '#666', lineHeight: '1.5' }}>
                블루투스 기기가 연결되어 있지 않습니다.<br />설정 페이지로 이동하시겠습니까?
              </p>
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn-secondary"
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#f1f5f9', color: '#64748b', fontWeight: '600' }}
                onClick={() => setIsAlertOpen(false)}
              >
                나중에
              </button>
              <button
                className="btn-primary"
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#2ecc71', color: 'white', fontWeight: '600' }}
                onClick={() => {
                  setIsAlertOpen(false);
                  onClose();
                  navigate('/Setting');
                }}
              >
                연결하기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default QuickMenu;