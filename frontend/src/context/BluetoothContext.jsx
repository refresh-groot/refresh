import React, { createContext, useState, useContext, useRef } from 'react'; // useRef 추가 필수

const BluetoothContext = createContext();

export function BluetoothProvider({ children }) {
  const [deviceName, setDeviceName] = useState(null);
  const [sendCommand, setSendCommand] = useState(null);
  const bleService = useRef(null); 

  const handleConnectSuccess = (info) => {
    if (!info) {
      setDeviceName(null);
      setSendCommand(null);
      bleService.current = null;
      return;
    }
    bleService.current = info;
    setDeviceName(info.deviceName);
    setSendCommand(() => info.sendCommand); // 함수 저장
  };

  return (
    <BluetoothContext.Provider value={{ sendCommand, deviceName, handleConnectSuccess }}>
      {children}
    </BluetoothContext.Provider>
  );
}

export const useBluetooth = () => useContext(BluetoothContext);
export default BluetoothContext;