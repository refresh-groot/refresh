import React, { useState } from 'react';
import { FaBluetooth } from 'react-icons/fa';

export const Bluetooth = ({ onConnectSuccess }) => {
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleDisconnect = (event) => {
    const device = event.target;
    console.log(`기기 연결 끊김: ${device.name}`);
    setConnectedDevice(null);
    if (onConnectSuccess) onConnectSuccess(null);
  };

  const connectBluetooth = async () => {
  setIsConnecting(true);
  try {
    // 1. 브라우저 지원 체크
    if (!navigator.bluetooth) throw new Error("NOT_SUPPORTED");

    // 2. 기기 요청
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: ['battery_service'] // 나중에 실제 UUID로 교체
    });

    // 3. 서버 연결
    const server = await device.gatt.connect();
    
    // 4. 연결 끊김 리스너 (함수 정의 확인 필수!)
    device.addEventListener('gattserverdisconnected', handleDisconnect);
    
    setConnectedDevice(device);
    if (onConnectSuccess) onConnectSuccess(device);
    
  } catch (error) {
    if (error.name === 'NotFoundError') return; // 취소는 조용히
    if (error.message === "NOT_SUPPORTED") {
        alert("이 브라우저는 블루투스를 지원하지 않습니다.");
    } else {
        alert("기기 연결 중 오류가 발생했습니다.");
    }
    console.error(error);
  } finally {
    setIsConnecting(false);
  }
};

  return (
    <div className="bluetooth-connect-area">
      {connectedDevice ? (
        <div className="ble-status-badge success">
          {connectedDevice.name || '기기'} 연결됨
        </div>
      ) : (
        <button 
          type="button"
          className="ble-connect-btn"
          onClick={connectBluetooth}
          disabled={isConnecting}
        >
          <FaBluetooth /> {isConnecting ? '연결 중...' : '기기 연동'}
        </button>
      )}
    </div>
  );
};