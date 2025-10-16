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
        pressure: 0,
        velocity: 0,
        altitude: 0,
        temperature: 0,
        longitude: 0,
        latitude: 0
    });

    useEffect(() => {
        if (!connected) return;

        const interval = setInterval(() => {
            const data = api.getSensorDataSocket();
            console.log(data);

            // ✅ Skip if no valid data yet
            if (!data || Object.keys(data).length === 0) return;

            // ✅ Helper to avoid .toFixed() on undefined
            const safe = (x) => (typeof x === 'number' && !isNaN(x) ? x.toFixed(2) : "0.00");

            setSensorData((prev) => ({
                accelerationX: safe(data.accXconv),
                accelerationY: safe(data.accYconv),
                accelerationZ: safe(data.accZconv),

                gyroscopeX: safe(data.gyroXconv),
                gyroscopeY: safe(data.gyroYconv),
                gyroscopeZ: safe(data.gyroZconv),

                pitch: safe(data.pitchDeg),
                pitchRate: safe(data.pitchRate),
                roll: safe(data.rollDeg),
                rollRate: safe(data.rollRate),

                pressure: safe(data.pres),
                velocity: safe(data.bvelo),
                altitude: safe(data.alt),
                temperature: safe(data.temp),

                longitude:
                    data.lat !== 0 || data.long !== 0
                        ? safe(data.long)
                        : prev.longitude,
                latitude:
                    data.lat !== 0 || data.long !== 0
                        ? safe(data.lat)
                        : prev.latitude,
            }));
        }, 25);

        return () => clearInterval(interval);
    }, [connected]);

    return sensorData;
};