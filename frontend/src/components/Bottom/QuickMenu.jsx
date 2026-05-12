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

const MENU = [
  {
    icon: <IoWaterOutline />,
    name: '급수제어',
    color: '#3b82f6',
    children: [
      { icon: <IoWaterOutline />, name: '급수', cmd: 'WATER 5' },
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
      { icon: <MdTune />, name: '펌프보정', cmd: 'CAL 8.5' },
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
  const { sendCommand, deviceName } = useBluetooth();
  const [activeParent, setActiveParent] = useState(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const navigate = useNavigate();

  const handleParent = (item, idx) => {
    if (item.cmd) {
      execCommand(item.cmd, item.name);
      return;
    }
    setActiveParent(activeParent === idx ? null : idx);
  };
        const execCommand = async (cmd, name) => {
  if (!deviceName || !sendCommand) {
    setIsAlertOpen(true);
    return;
  }

  try {
    await sendCommand(cmd);
    showToast('success', `${name} 명령을 전송했습니다.`);

    if (cmd.startsWith('WATER') && currentPlant?.id) {
      const duration = parseInt(cmd.split(' ')[1]) || 5;
      await fetch(`${SERVER_URL}/api/watering-log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plant_id: currentPlant.id,
          is_auto: false,
          duration_sec: duration
        })
      });
      window.dispatchEvent(new CustomEvent('wateringDone')); // ← 이거 추가
    }

    onClose();
  } catch (error) {
    console.error('명령 전송 실패:', error);
    showToast('error', '명령 전송에 실패했습니다.');
  }
};

  const handleChild = async (item) => {
    if (item.special === 'plant' || item.special === 'wifi') {
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