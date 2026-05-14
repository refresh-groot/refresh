import React, { createContext, useState, useContext, useRef } from 'react';

const BluetoothContext = createContext();

export function BluetoothProvider({ children }) {
  const [deviceName, setDeviceName] = useState(null);
  const [sendCommand, setSendCommand] = useState(null);
  const [isAutoMode, setIsAutoMode] = useState(true); // 추가
  const bleService = useRef(null);
  const [pumpRate, setPumpRate] = useState(8.5);

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
  };

  return (
    <BluetoothContext.Provider value={{ sendCommand, deviceName, handleConnectSuccess, isAutoMode, setIsAutoMode, pumpRate, setPumpRate }}>
      {children}
    </BluetoothContext.Provider>
  );
}

export const useBluetooth = () => useContext(BluetoothContext);
export default BluetoothContext;