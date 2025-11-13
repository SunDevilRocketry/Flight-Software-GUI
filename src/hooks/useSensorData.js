import { useState, useEffect } from 'react';
import { api } from '@/utils/api';
import { MockFlight } from '@/utils/mock';

// --- Utility: Formats numbers safely ---
const toFixed = (value, digits = 2) =>
  Number.parseFloat(value ?? 0).toFixed(digits);

// --- Utility: Converts raw sensor data to consistent state shape ---
const parseSensorData = (data, prevState) => {
    if (!data) {
        return prevState;
    }

    return {
        accelerationX: toFixed(data.accXconv),
        accelerationY: toFixed(data.accYconv),
        accelerationZ: toFixed(data.accZconv),

        gyroscopeX: toFixed(data.gyroXconv),
        gyroscopeY: toFixed(data.gyroYconv),
        gyroscopeZ: toFixed(data.gyroZconv),

        pitch: toFixed(data.pitchDeg),
        pitchRate: toFixed(data.pitchRate),
        roll: toFixed(data.rollDeg),
        rollRate: toFixed(data.rollRate),

        pressure: toFixed(data.pres),
        velocity: toFixed(data.bvelo),
        altitude: toFixed(data.alt),

        time: data.time ?? prevState.time,

        longitude: data.lat !== 0 || data.long !== 0 ? data.long : prevState.longitude,
        latitude: data.lat !== 0 || data.long !== 0 ? data.lat : prevState.latitude,
        chipTemperature: toFixed(data.temp ?? prevState.chipTemperature),
    };
};

// --- Custom Hook ---
export const useSensorData = (connected, mock, onConnectionLost) => {
  const [sensorData, setSensorData] = useState(() => ({
    accelerationX: 0, 
    accelerationY: 0, 
    accelerationZ: 0,
    gyroscopeX: 0, 
    gyroscopeY: 0, 
    gyroscopeZ: 0,
    pitch: 0, 
    pitchRate: 0,
    roll: 0, 
    rollRate: 0, 
    yaw: 0,
        yawRate: 0,
    pressure: 0, 
    velocity: 0, 
    altitude: 0, 
    chipTemperature: 0,
    longitude: 0, 
    latitude: 0,
    time: 0,
  }));

  let [rowCount, setRowCount] = useState(0);
  const pollingInterval = 100;

  useEffect(() => {
    if (!connected && !mock) return;

    const fetchData = async () => {
      try {
          const result = mock
          ? await MockFlight.getSensorData(rowCount)
          : (await api.getSensorData()).data;
          
        setSensorData(prev => parseSensorData(result, prev));
        if (mock) setRowCount(count => count + 1);
      } catch (err) {
        console.error('Connection error:', err);
        if (!mock) onConnectionLost?.();
      }
    };

    const interval = setInterval(fetchData, pollingInterval);
    return () => clearInterval(interval);
  }, [connected, mock, rowCount, onConnectionLost]);

  return sensorData;
};
