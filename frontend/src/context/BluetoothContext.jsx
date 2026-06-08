import React, { createContext, useState, useContext, useRef } from 'react';

const BluetoothContext = createContext();

export function BluetoothProvider({ children }) {
  const [deviceName, setDeviceName] = useState(null);
  const [sendCommand, setSendCommand] = useState(null);
  const [isAutoMode, setIsAutoMode] = useState(true); // 추가
  const bleService = useRef(null);
  const [pumpRate, setPumpRate] = useState(8.5);
  const [sensorData, setSensorData] = useState(null);

  const handleConnectSuccess = (info) => {
    if (!info) {
      setDeviceName(null);
      setSendCommand(null);
      bleService.current = null;
      return;
    }
    bleService.current = info;
    setDeviceName(info.deviceName);
    setSendCommand(() => info.sendCommand);
    if (info.device) {
    info.device.addEventListener('characteristicvaluechanged', (event) => {
      const text = new TextDecoder().decode(event.target.value);
      handleBleMessage(text);
    });
  }
};

const handleBleMessage = (text) => {
  console.log('📥 BLE 수신:', text);

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
      soil: soil ? parseInt(soil) : null,
      temp: temp ? parseFloat(temp) : null,
      humid: humi ? parseFloat(humi) : null,
      light: light ? parseInt(light) : null,
    });
  }
};



  return (
    <BluetoothContext.Provider value={{ sendCommand, deviceName, handleConnectSuccess, isAutoMode, setIsAutoMode, pumpRate, setPumpRate, sensorData, setSensorData }}>
      {children}
    </BluetoothContext.Provider>
  );
}

export const useBluetooth = () => useContext(BluetoothContext);
export default BluetoothContext;