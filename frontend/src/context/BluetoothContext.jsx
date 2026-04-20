import React, { createContext, useState, useContext } from 'react';

const BluetoothContext = createContext();

export function BluetoothProvider({ children }) {
  const [sendCommand, setSendCommand] = useState(null);
  const [deviceName, setDeviceName] = useState(null);

  const handleConnectSuccess = (info) => {
    if (!info) {
      setSendCommand(null);
      setDeviceName(null);
      return;
    }
    setSendCommand(() => info.sendCommand);
    setDeviceName(info.deviceName);
  };

  return (
    <BluetoothContext.Provider value={{ sendCommand, deviceName, handleConnectSuccess }}>
      {children}
    </BluetoothContext.Provider>
  );
}

export const useBluetooth = () => useContext(BluetoothContext);
export default BluetoothContext;