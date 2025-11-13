import { useState, useEffect } from 'react';
import { api } from '@/utils/api';

export const useSensorData = (connected, onConnectionLost) => {
    const [sensorData, setSensorData] = useState({
        accelerationX: 0.0,
        accelerationY: 0.0,
        accelerationZ: 0.0,
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
        latitude: 0
    });

    useEffect(() => {
        if (!connected) return;

        const interval = setInterval(() => {
            api.getSensorData()
                .then(response => {
                    const data = response.data;
                    setSensorData({
                        //Acceleration
                        accelerationX: data.accXconv,
                        accelerationY: data.accYconv,
                        accelerationZ: data.accZconv,

                        //Gyroscope
                        gyroscopeX: data.gyroXconv,
                        gyroscopeY: data.gyroYconv,
                        gyroscopeZ: data.gyroZconv,

                        //Rotation
                        pitch: data.pitchDeg,
                        pitchRate: data.pitchRate,
                        roll: data.rollDeg,
                        rollRate: data.rollRate,
                        yaw: data.yawDeg,
                        yawRate: data.yawRate,

                        //Other
                        pressure: data.pres,
                        velocity: data.bvelo,
                        altitude: data.alt,
                        longitude: data.lat !== 0 || data.long !== 0 ? data.long : sensorData.longitude,
                        latitude: data.lat !== 0 || data.long !== 0 ? data.lat : sensorData.latitude
                    })
                })
                .catch(error => {
                    console.error('No connection:', error);
                    onConnectionLost();
                });
        }, 50);

        return () => clearInterval(interval);

    }, [connected]);

    return sensorData;


}