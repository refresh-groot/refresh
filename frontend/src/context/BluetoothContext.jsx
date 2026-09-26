import React, { createContext, useEffect, useRef, useState } from 'react';

const BluetoothContext = createContext();

const SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const RX_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
const TX_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';
const MAX_RECONNECT_ATTEMPTS = 3;

export function BluetoothProvider({ children }) {
  const [deviceName, setDeviceName] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [sendCommand, setSendCommand] = useState(null);
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [pumpRate, setPumpRate] = useState(8.5);
  const [sensorData, setSensorData] = useState(null);
  const [sensorUpdatedAt, setSensorUpdatedAt] = useState(null);

  const deviceRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef(null);

  const handleBleMessage = (text) => {
    if (text.includes('WATER_DONE')) {
      window.dispatchEvent(new CustomEvent('wateringDone'));
      return;
    }

    if (text.includes('Soil:')) {
      const soil = text.match(/Soil:(\d+)/)?.[1];
      const temp = text.match(/Temp:([\d.]+)/)?.[1];
      const humi = text.match(/Humi:([\d.]+)/)?.[1];
      const light = text.match(/Light:(\d+)/)?.[1];

      setSensorData({
        soil: soil ? parseInt(soil, 10) : null,
        temp: temp ? parseFloat(temp) : null,
        humid: humi ? parseFloat(humi) : null,
        light: light ? parseInt(light, 10) : null,
      });
      setSensorUpdatedAt(Date.now());
    }
  };

  const connectToDevice = async (device) => {
    setIsConnecting(true);

    try {
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(SERVICE_UUID);
      const rxChar = await service.getCharacteristic(RX_UUID);
      const txChar = await service.getCharacteristic(TX_UUID);

      await txChar.startNotifications();
      txChar.addEventListener('characteristicvaluechanged', (event) => {
        handleBleMessage(new TextDecoder().decode(event.target.value));
      });

      let isWriting = false;
      const commandSender = async (command) => {
        if (!device.gatt.connected) {
          throw new Error('블루투스 기기가 연결되어 있지 않습니다.');
        }
        if (isWriting) {
          throw new Error('이전 명령을 처리 중입니다.');
        }

        try {
          isWriting = true;
          await rxChar.writeValue(new TextEncoder().encode(`${command}\n`));
          await new Promise((resolve) => setTimeout(resolve, 150));
        } finally {
          isWriting = false;
        }
      };

      reconnectAttemptsRef.current = 0;
      setDeviceName(device.name);
      setSendCommand(() => commandSender);
      setIsConnected(true);

      return { device, deviceName: device.name, sendCommand: commandSender, txChar };
    } finally {
      setIsConnecting(false);
    }
  };

  const reconnect = async () => {
    const device = deviceRef.current;
    if (!device || device.gatt.connected || reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      return;
    }

    reconnectAttemptsRef.current += 1;
    try {
      await connectToDevice(device);
    } catch (error) {
      console.warn(`🔵 블루투스 재연결 실패 (${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`, error);
      reconnectTimerRef.current = setTimeout(reconnect, 1500);
    }
  };

  const handleDisconnect = (event) => {
    const device = event.target;
    console.warn(`⚠️ [BLE] 연결 끊김 - 기기명: ${device.name}`);
    setIsConnected(false);
    setSendCommand(null);

    if (device === deviceRef.current) {
      reconnectTimerRef.current = setTimeout(reconnect, 1500);
    }
  };

  const connectBluetooth = async () => {
    if (!navigator.bluetooth) {
      throw new Error('이 브라우저는 Web Bluetooth를 지원하지 않습니다.');
    }

    let device = deviceRef.current;
    if (!device) {
      device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: 'ESP32' }],
        optionalServices: [SERVICE_UUID],
      });
      deviceRef.current = device;
      device.addEventListener('gattserverdisconnected', handleDisconnect);
    }

    if (device.gatt.connected) {
      return { device, deviceName: device.name, sendCommand };
    }

    return connectToDevice(device);
  };

  useEffect(() => () => clearTimeout(reconnectTimerRef.current), []);

  return (
    <BluetoothContext.Provider value={{ deviceName, isConnected, isConnecting, sendCommand, connectBluetooth, isAutoMode, setIsAutoMode, pumpRate, setPumpRate, sensorData, sensorUpdatedAt }}>
      {children}
    </BluetoothContext.Provider>
  );
}

export default BluetoothContext;
