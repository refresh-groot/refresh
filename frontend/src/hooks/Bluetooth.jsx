import React, { useState } from 'react';
import { FaBluetooth } from 'react-icons/fa';
import { showToast } from '../app/alert';

export const Bluetooth = ({ onConnectSuccess, onMessageReceived }) => {
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // 고유 UUID 정의 (사용자님의 ESP32 설정과 일치)
  const SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
  const RX_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'; // 앱 -> ESP32 (Write)
  const TX_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e'; // ESP32 -> 앱 (Notify)

  const handleDisconnect = (event) => {
    const device = event.target;
    console.log(`기기 연결 끊김: ${device.name}`);
    setConnectedDevice(null);
    if (onConnectSuccess) onConnectSuccess(null);
  };

  const connectBluetooth = async () => {
    setIsConnecting(true);
    console.log("--- 블루투스 연동 시작 ---");
    try {
      if (!navigator.bluetooth){ 
        console.error("결과: 이 브라우저는 블루투스를 지원하지 않음");
        throw new Error("NOT_SUPPORTED");
      }

      // 1. 기기 요청 (이름 접두사로 필터링)
      console.log("단계: 기기 선택 팝업 대기 중...");
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: "ESP32_PUMP" }],  // "ESP32_PUMP"로 시작하는 모든 기기 검색 할수있도록(1) (2)처럼 여러개  받아오기 위한거
        optionalServices: [SERVICE_UUID]
      });

      console.log("성공: 기기 선택 완료 ->", {
      name: device.name,
      id: device.id
    });

      // 2. GATT 서버 연결
      console.log("단계: GATT 서버 연결 시도...");
      const server = await device.gatt.connect();
      
      // 3. 서비스 가져오기
      const service = await server.getPrimaryService(SERVICE_UUID);

      // 4. [RX] 보내기 통로 설정
      const rxChar = await service.getCharacteristic(RX_UUID);
      const sendCommand = async (command) => {
        const encoder = new TextEncoder();
        await rxChar.writeValue(encoder.encode(command));
        console.log(`[보냄]: ${command}`);
      };

      // 5. [TX] 받기 통로 설정 (알림 구독)
      const txChar = await service.getCharacteristic(TX_UUID);
      await txChar.startNotifications();
      txChar.addEventListener('characteristicvaluechanged', (event) => {
        const value = event.target.value;
        const decoder = new TextDecoder();
        const receivedText = decoder.decode(value);
        console.log(`[받음]: ${receivedText}`);
        
        // 부모 컴포넌트에 메시지 전달 (예: 습도값 업데이트 등)
        if (onMessageReceived) onMessageReceived(receivedText);
      });

      console.log("성공: GATT 서버 연결 완료! 상태:", device.gatt.connected);
      device.addEventListener('gattserverdisconnected', handleDisconnect);
      
      setConnectedDevice(device);
      
      // 연결 성공 시 기기 정보와 명령 함수를 함께 전달
      if (onConnectSuccess) {
        onConnectSuccess({ 
          device, 
          sendCommand, 
          deviceName: device.name 
        });
      }
      showToast('success', '블루투스 연동 성공!');
      
    } catch (error) {
      if (error.name === 'NotFoundError') return;
      console.warn("결과: 사용자가 기기 선택을 취소함");
      alert(error.message === "NOT_SUPPORTED" ? "블루투스 미지원 브라우저입니다." : "연결 오류가 발생했습니다.");
      console.error(error);
    } finally {
      setIsConnecting(false);
      console.log("--- 블루투스 프로세스 종료 ---");
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