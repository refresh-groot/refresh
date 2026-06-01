import React, { useState, useEffect, useRef } from 'react';
import { FaBluetooth } from 'react-icons/fa';
import { showToast } from '../app/alert';

export const Bluetooth = ({ onConnectSuccess, onMessageReceived }) => {
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // [추가] 하트비트 인터벌을 저장할 Ref
  const heartbeatInterval = useRef(null);

  const SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
  const RX_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
  const TX_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

  // [추가] 컴포넌트가 언마운트될 때 하트비트 타이머 정리
  useEffect(() => {
    return () => {
      if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
    };
  }, []);

  const handleDisconnect = (event) => {
    const device = event.target;
    console.warn(`⚠️ [BLE] 연결 끊김 - 기기명: ${device.name}`);
    setConnectedDevice(null);
    
    // [추가] 기기 연결이 끊어지면 하트비트 정지
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
    }
    
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
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [SERVICE_UUID]
      });

      // [방어 코드] 사용자가 팝업에서 취소하여 device가 없는 경우 처리
      if (!device) {
        console.warn("기기 선택이 취소되었습니다.");
        setIsConnecting(false);
        return;
      }

      console.log('✅ [1] 기기 선택 완료');
      console.log('   - name:', device.name);
      
      // 2. GATT 연결
      console.log('📌 [2] GATT 서버 연결 시도...');
      const server = await device.gatt.connect();
      console.log('✅ [2] GATT 연결 성공');

      // 3. 서비스
      console.log('📌 [3] Primary Service 가져오는 중...');
      const service = await server.getPrimaryService(SERVICE_UUID);
      console.log('✅ [3] 서비스 획득 성공');

      // 4. RX Characteristic
      console.log('📌 [4] RX Characteristic 가져오는 중...');
      const rxChar = await service.getCharacteristic(RX_UUID);
      
      // [락 메커니즘을 위한 상태 변수 제어]
      let isWriting = false;

      const sendCommand = async (command) => {
        // 이전 명령어가 처리 중이면 락이 풀릴 때까지 대기 조율 (최대 3초)
        let attempts = 0;
        while (isWriting && attempts < 30) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }

        try {
          isWriting = true; // 통신 시작 시 락 잠금
          
          // [수정] 15초마다 보내는 PING 명령어가 콘솔을 도배하지 않도록 예외 처리
          if (command !== "STATE") {
            console.log(`📤 [sendCommand] 전송: "${command}"`);
          }
          
          const encoder = new TextEncoder();
          
          // 명령어 뒤에 개행문자(\n)를 추가하여 하드웨어 파싱 안정화 및 writeValue 실행
          await rxChar.writeValue(encoder.encode(command + "\n"));
          
          // 하드웨어가 명령을 처리하고 숨 돌릴 수 있는 최소한의 시간(150ms) 보장
          await new Promise(resolve => setTimeout(resolve, 150));
        } catch (err) {
          console.error("명령어 전송 중 실패:", err);
          throw err;
        } finally {
          isWriting = false; // 전송이 끝나거나 에러가 나면 무조건 락 해제
        }
      };

      // 5. TX Characteristic
      console.log('📌 [5] TX Characteristic 가져오는 중...');
      const txChar = await service.getCharacteristic(TX_UUID);
      
      console.log('📌 [5-1] TX 알림 구독 시작...');
      await txChar.startNotifications();
      
      txChar.addEventListener('characteristicvaluechanged', (event) => {
        const receivedText = new TextDecoder().decode(event.target.value);
        // [수정] STATE 응답이 콘솔을 도배하지 않도록 예외 처리
        if (!receivedText.includes("STATE")) {
          console.log(`📥 [받음]: ${receivedText}`);
        }
        if (onMessageReceived) onMessageReceived(receivedText);
      });

      device.addEventListener('gattserverdisconnected', handleDisconnect);
      setConnectedDevice(device);

      if (onConnectSuccess) {
        onConnectSuccess({ device, sendCommand, deviceName: device.name });
      }

      showToast('success', '블루투스 연동 성공!');

      // [추가] 하트비트(Keep-Alive) 로직: 15초마다 "STATE" 명령을 보내 연결 유지
      if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = setInterval(() => {
        sendCommand("STATE").catch(e => console.error("Heartbeat 에러:", e));
      }, 15000);

    } catch (error) {
      console.error('❌ 블루투스 오류 발생:', error);

      if (error.name === 'NotFoundError') {
        console.warn('   → 사용자가 팝업에서 취소함');
      } else {
        alert(`연결 오류: ${error.message}`);
      }
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