import { useContext } from 'react';
import BluetoothContext from '../context/BluetoothContext';

export const useBluetooth = () => useContext(BluetoothContext);
