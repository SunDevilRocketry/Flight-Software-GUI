import { useState, useEffect, use } from 'react';
import { api } from '@/utils/api';
import { MockFlight } from '@/utils/mock';
import { Result } from 'postcss';

export const useSensorData = (connected, mock, onConnectionLost) => {
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
        chipTemperature: 0,
        longitude: 0,
        latitude: 0
    });
    
    const [rowCount,setRowCount] = useState(0)
    useEffect(() => {
        if(!connected && !mock) { return }
        else if (!connected && mock)
        {
            
            const interval = setInterval(() => {
                MockFlight.getSensorData(rowCount).then((data) => 
                {   
                    //console.log(data)
                    setSensorData(
                    {
                       //Acceleration
                        accelerationX: parseFloat(data.accXconv).toFixed(2),
                        accelerationY: parseFloat(data.accYconv).toFixed(2),
                        accelerationZ: parseFloat(data.accZconv).toFixed(2),

                        //Gyroscope
                        gyroscopeX: parseFloat(data.gyroXconv).toFixed(2),
                        gyroscopeY: parseFloat(data.gyroYconv).toFixed(2),
                        gyroscopeZ: parseFloat(data.gyroZconv).toFixed(2),

                        //Rotation
                        pitch: parseFloat(data.pitchDeg).toFixed(2),
                        pitchRate: parseFloat(data.pitchRate).toFixed(2),
                        roll: parseFloat(data.rollDeg).toFixed(2),
                        rollRate: parseFloat(data.rollRate).toFixed(2),

                        //Other
                        pressure: parseFloat(data.pres).toFixed(2),
                        velocity: parseFloat(data.bvelo).toFixed(2),
                        altitude: parseFloat(data.alt).toFixed(2),
                        longitude: data.lat !== 0 || data.long !== 0 ? data.long : sensorData.longitude,
                        latitude: data.lat !== 0 || data.long !== 0 ? data.lat : sensorData.latitude
                    })
                })
                setRowCount(prevCount => prevCount + 1);
                //console.log("ROW COUNT: " + rowCount)
            },100)
            

            return () => clearInterval(interval);


            
        
        }

        else if (connected && !mock){
            const interval = setInterval(() => {
            api.getSensorData()
                .then(response => {
                    const data = response.data;
                    setSensorData({
                        //Acceleration
                        accelerationX: data.accXconv.toFixed(2),
                        accelerationY: data.accYconv.toFixed(2),
                        accelerationZ: data.accZconv.toFixed(2),

                        //Gyroscope
                        gyroscopeX: data.gyroXconv.toFixed(2),
                        gyroscopeY: data.gyroYconv.toFixed(2),
                        gyroscopeZ: data.gyroZconv.toFixed(2),

                        //Rotation
                        pitch: data.pitchDeg.toFixed(2),
                        pitchRate: data.pitchRate.toFixed(2),
                        roll: data.rollDeg.toFixed(2),
                        rollRate: data.rollRate.toFixed(2),

                        //Other
                        pressure: data.pres.toFixed(2),
                        velocity: data.bvelo.toFixed(2),
                        altitude: data.alt.toFixed(2),
                        longitude: data.lat !== 0 || data.long !== 0 ? data.long : sensorData.longitude,
                        latitude: data.lat !== 0 || data.long !== 0 ? data.lat : sensorData.latitude
                    })
                })
                .catch(error => {
                    console.error('No connection:', error);
                    onConnectionLost();
                });
        }, 100);

        return () => clearInterval(interval);

        }
        
    });

    return sensorData;


}