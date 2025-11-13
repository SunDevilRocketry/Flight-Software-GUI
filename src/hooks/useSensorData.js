import { useState, useEffect } from 'react';
import { api } from '@/utils/api';
import { MockFlight } from '@/utils/mock';

// --- Utility: Formats numbers safely ---
const toFixed = (value, prevVal, digits = 2) =>
  {
    if (value === null || value === undefined || isNaN(value)) {
      //console.log("Invalid value encountered in toFixed:", value, "\nSetting to Previous Value: ",prevVal);
      return prevVal;
    }
    return Number.parseFloat(value).toFixed(digits);
  

  }

// --- Utility: Converts raw sensor data to consistent state shape ---
const parseSensorData = (data, prevState) => {
    if (!data) {
        return prevState;
    }
    console.log("PARSING FETCHED DATA")
    return {
        accelerationX: toFixed(data.accXconv, prevState.accXconv),
        accelerationY: toFixed(data.accYconv, prevState.accYconv),
        accelerationZ: toFixed(data.accZconv, prevState.accZconv),

        gyroscopeX: toFixed(data.gyroXconv, prevState.gyroXconv),
        gyroscopeY: toFixed(data.gyroYconv, prevState.gyroYconv),
        gyroscopeZ: toFixed(data.gyroZconv, prevState.gyroZconv),

        pitch: toFixed(data.pitchDeg, prevState.pitchDeg),
        pitchRate: toFixed(data.pitchRate, prevState.pitchRate),
        roll: toFixed(data.rollDeg, prevState.rollDeg),
        rollRate: toFixed(data.rollRate, prevState.rollRate),
        yaw: toFixed(data.yawDeg, prevState.yawDeg),
        yawRate: toFixed(data.yawRate, prevState.yawRate),

        pressure: toFixed(data.pres, prevState.pres),
        velocity: toFixed(data.bvelo, prevState.bvelo),
        altitude: toFixed(data.alt, prevState.alt),

        time: data.time ?? prevState.time,

        longitude: data.lat !== 0 || data.long !== 0 ? data.long : prevState.longitude,
        latitude: data.lat !== 0 || data.long !== 0 ? data.lat : prevState.latitude,
        chipTemperature: toFixed(data.temp ?? prevState.chipTemperature),
    };
};

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
  const pollingInterval = 40;

  useEffect(() => {
    if (!connected && !mock) return;

    const fetchData = async () => {
      try 
      {
        let oldResult = null; 
        let result = mock
        ? await MockFlight.getSensorData(rowCount)
        : (await api.getSensorData()).data;
        
        //console.log("Fetched Sensor Data:", result);

        //Removes random flickering NaN values from mock data by reusing last valid data
        result.length == undefined ? oldResult = result : result = oldResult
        
        setSensorData(parseSensorData(result, sensorData));
        if (mock) setRowCount(count => count + 1);
      } catch (err) 
      {
        console.error('Connection error:', err);
        if (!mock) onConnectionLost?.();
      }
    };

    const interval = setInterval(fetchData, pollingInterval);
    return () => clearInterval(interval);
  }, [connected, mock, rowCount, onConnectionLost]);

  return sensorData;
};
