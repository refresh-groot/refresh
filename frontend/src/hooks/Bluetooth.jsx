import React, { useState } from 'react';
import { FaBluetooth } from 'react-icons/fa';
import { showToast } from '../app/alert';

export const Bluetooth = ({ onConnectSuccess, onMessageReceived }) => {
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
  const RX_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
  const TX_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

  const handleDisconnect = (event) => {
    const device = event.target;
    console.warn(`⚠️ [BLE] 연결 끊김 - 기기명: ${device.name}`);
    setConnectedDevice(null);
    if (onConnectSuccess) onConnectSuccess(null);
  };

  const connectBluetooth = async () => {
    setIsConnecting(true);
    console.group('🔵 블루투스 연동 시작');

    try {
      // 0. Web Bluetooth 지원 여부
      console.log('📌 [0] navigator.bluetooth 존재 여부:', !!navigator.bluetooth);
      if (!navigator.bluetooth) {
        throw new Error("NOT_SUPPORTED");
      }

      // 1. 기기 선택
      console.log('📌 [1] 기기 선택 팝업 오픈 중...');
      console.log('   - 필터: namePrefix = "ESP32_PUMP"');
      console.log('   - optionalServices:', SERVICE_UUID);
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: "ESP32_PUMP" }],
        optionalServices: [SERVICE_UUID]
      });
      console.log('✅ [1] 기기 선택 완료');
      console.log('   - name:', device.name);
      console.log('   - id:', device.id);
      console.log('   - gatt 존재 여부:', !!device.gatt);

      // 2. GATT 연결
      console.log('📌 [2] GATT 서버 연결 시도...');
      const server = await device.gatt.connect();
      console.log('✅ [2] GATT 연결 결과');
      console.log('   - server 객체:', server);
      console.log('   - connected 상태:', server.connected);
      console.log('   - device.gatt.connected:', device.gatt.connected);

      // 3. 서비스
      console.log('📌 [3] Primary Service 가져오는 중...');
      console.log('   - 요청 UUID:', SERVICE_UUID);
      const service = await server.getPrimaryService(SERVICE_UUID);
      console.log('✅ [3] 서비스 획득 성공:', service);

      // 4. RX Characteristic
      console.log('📌 [4] RX Characteristic 가져오는 중...');
      console.log('   - 요청 UUID:', RX_UUID);
      const rxChar = await service.getCharacteristic(RX_UUID);
      console.log('✅ [4] RX 획득:', rxChar);
      console.log('   - properties:', rxChar.properties);

      const sendCommand = async (command) => {
        console.log(`📤 [sendCommand] 전송: "${command}"`);
        const encoder = new TextEncoder();
        await rxChar.writeValue(encoder.encode(command));
        console.log(`✅ [sendCommand] 전송 완료: "${command}"`);
      };

      // 5. TX Characteristic
      console.log('📌 [5] TX Characteristic 가져오는 중...');
      console.log('   - 요청 UUID:', TX_UUID);
      const txChar = await service.getCharacteristic(TX_UUID);
      console.log('✅ [5] TX 획득:', txChar);
      console.log('   - properties:', txChar.properties);

      console.log('📌 [5-1] TX 알림 구독 시작...');
      await txChar.startNotifications();
      console.log('✅ [5-1] 알림 구독 완료');

      txChar.addEventListener('characteristicvaluechanged', (event) => {
        const receivedText = new TextDecoder().decode(event.target.value);
        console.log(`📥 [받음]: ${receivedText}`);
        if (onMessageReceived) onMessageReceived(receivedText);
      });

      // 6. 최종 상태
      console.log('📌 [6] 최종 연결 상태 확인');
      console.log('   - device.name:', device.name);
      console.log('   - device.gatt.connected:', device.gatt.connected);

      device.addEventListener('gattserverdisconnected', handleDisconnect);
      setConnectedDevice(device);

      if (onConnectSuccess) {
        onConnectSuccess({ device, sendCommand, deviceName: device.name });
        console.log('✅ [6] onConnectSuccess 호출 완료 - deviceName:', device.name);
      }

      showToast('success', '블루투스 연동 성공!');

    } catch (error) {
      console.group('❌ 블루투스 오류 발생');
      console.log('   - error.name:', error.name);
      console.log('   - error.message:', error.message);
      console.log('   - 전체 error:', error);
      console.groupEnd();

      if (error.name === 'NotFoundError') {
        console.warn('   → 사용자가 팝업에서 취소함 (정상)');
        return;
      }
      alert(error.message === "NOT_SUPPORTED"
        ? "블루투스 미지원 브라우저입니다."
        : `연결 오류: ${error.message}`);
    } finally {
      setIsConnecting(false);
      console.groupEnd();
      console.log('🔵 블루투스 프로세스 종료');
    }
  };

  return (
    <div className="bluetooth-connect-area">
      {connectedDevice ? (
        <div className="ble-status-badge success">
          <FaBluetooth /> {connectedDevice.name} 연결됨
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