import React from 'react';
import { FaBluetooth } from 'react-icons/fa';
import { showToast } from '../../app/alert';
import { useBluetooth } from '../../hooks/useBluetooth';

export const Bluetooth = ({ onConnectSuccess }) => {
  const { deviceName, isConnected, isConnecting, connectBluetooth } = useBluetooth();

  const handleConnect = async () => {
    try {
      const info = await connectBluetooth();
      if (onConnectSuccess) {
        await onConnectSuccess(info);
      }
      showToast('success', '블루투스 연동 성공!');
    } catch (error) {
      console.error('❌ 블루투스 오류 발생:', error);
      if (error.name !== 'NotFoundError') {
        showToast('error', `블루투스 연결에 실패했습니다: ${error.message}`);
      }
    }
  };

  if (isConnected) {
    return (
      <div className="ble-status-badge success">
        <FaBluetooth /> {deviceName} 연결됨
      </div>
    );
  }

  return (
    <div className="bluetooth-connect-area">
      <button type="button" className="ble-connect-btn" onClick={handleConnect} disabled={isConnecting}>
        <FaBluetooth /> {isConnecting ? '연결 중...' : (deviceName ? '다시 연결' : '기기 연동')}
      </button>
    </div>
  );
};
