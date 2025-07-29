"use client"
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Viewer, Entity, PointGraphics } from "resium";
import { Cartesian3 } from "cesium";
//import MyThree from './Three';
import MyThree from '@/components/Three';
import RocketSilhouette from '@/components/RocketScene';
import ReactDOM from "react-dom/client";
import ResTest from "@/components/ResTest";
import GoogleMap from "@/components/GoogleMaps";
import axios from "axios";
import FourthPane from "@/components/FourthPane";


export default function Home() {
  // for data gauges
  // State variables for the flight data (initial values are placeholders)
  const [accelerationX, setAccelerationX] = useState(0.0);
  const [accelerationY, setAccelerationY] = useState(0.0);
  const [accelerationZ, setAccelerationZ] = useState(0.0);
  const [gyroscopeX, setGyroscopeX] = useState(0);
  const [gyroscopeY, setGyroscopeY] = useState(0);
  const [gyroscopeZ, setGyroscopeZ] = useState(0);
  const [pitch, setPitch] = useState(0);
  const [pitchRate, setPitchRate] = useState(0);
  const [roll, setRoll] = useState(0);
  const [rollRate, setRollRate] = useState(0);
  const [pressure, setPressure] = useState(0);
  const [velocity, setVelocity] = useState(0);
  const [altitude, setAltitude] = useState(0);
  const [chipTemperature, setChipTemperature] = useState(0);
  const [comports, setComports] = useState([]);

  // for google map  33.420659, -111.929530
  const [longitude, setLongitude] = useState(135.000);
  const [latitude, setLatitude] = useState(82.8628);
  const [connected, setConnected] = useState(false);

  // React states for boards
  const [boards, setBoards] = useState([]);
  const [boardInfo, setBoardInfo] = useState({
    firmware: null,
    name: null,
    status: null,
  })
  const [reset, setReset] = useState(false);

  useEffect(() => {
    axios.get('http://127.0.0.1:5000/comports-l')
      .then(response => {
        console.log('Boards:', response.data);
        setBoards(response.data)
      })
      .catch(error => {
        console.error('Error fetching board data, please check your backend:', error);
        setBoardInfo(null);
        setBoards([]);
      });
  },[reset])

  useEffect(() => {
    if (!connected) {
      const interval = setInterval(() => {
        check_backend_status();
      }, 2000);
  
      return () => clearInterval(interval);
    }
  }, [connected]);

  const DataPane = () => {
    return (
      <div className="w-1/2 mb-6 p-5 bg-red-800 rounded-lg">
        <h1 className="text-2xl font-bold">Data Gauges</h1>
          <div className="grid grid-cols-2 grid-rows-3 gap-x-24">
            <div className="">
              <p className="text-lg font-bold">Acceleration</p>
              <div className="text-sm">
                <p>X: {accelerationX}</p>
                <p>Y: {accelerationY}</p>
                <p>Z: {accelerationZ}</p>
              </div>
            </div>
            <div>
              <p className="text-lg font-bold">Barometer</p>
              <div className="text-sm">
                <p>Pressure: {pressure}</p>
                <p>Velocity: {velocity}</p>
                <p>Altitude: {altitude}</p>
              </div>
              
            </div>
            <div>
              <p className="text-lg font-bold">Gyroscope</p>
              <div className="text-sm">
                <p>X: {gyroscopeX}</p>
                <p>Y: {gyroscopeY}</p>
                <p>Z: {gyroscopeZ}</p>
              </div>
            </div>
            <div className="">
              <p className="text-lg font-bold">Chip Temperature: </p> 
              <p>{chipTemperature}</p>
            </div>
            <div>
              <p className="text-lg font-bold">Orientation</p>
              <div className="text-sm">
                <p>Pitch: {pitch}</p>
                <p>Pitch Rate: {pitchRate}</p>
                <p>Roll: {pitch}</p>
                <p>Roll Rate: {rollRate}</p>
              </div>
            </div>
            <div>
              <p className="text-lg font-bold">Location</p>
              <div className="text-sm">
                <p>latitude: {latitude}</p>
                <p>longitude: {longitude}</p>
              </div>
            </div>
          </div>
      </div>
    )
  }

  const SensorDataListener = () => {
    useEffect(() => {
        if (!connected) return;
        const interval = setInterval(() => {
          axios.get("http://127.0.0.1:5000/sensor-dump")
            .then(response => {
              setAccelerationX(response.data["accX"].toFixed(2))
              setAccelerationY(response.data["accY"].toFixed(2))
              setAccelerationZ(response.data["accZ"].toFixed(2))
              setGyroscopeX(response.data["gyroX"].toFixed(2));
              setGyroscopeY(response.data["gyroY"].toFixed(2));
              setGyroscopeZ(response.data["gyroZ"].toFixed(2));
              setPitch(response.data["pitchDeg"].toFixed(2));
              setPitchRate(response.data["pitchRate"].toFixed(2));
              setRoll(response.data["rollDeg"].toFixed(2));
              setRollRate(response.data["rollRate"].toFixed(2));
              setPressure(response.data["pres"].toFixed(2));
              setVelocity(response.data["bvelo"].toFixed(2));
              setAltitude(response.data["alt"].toFixed(2));
              if (!(response.data["lat"] == 0 && response.data["long"] == 0)){
                  setLatitude(response.data["lat"]);
                  setLongitude(response.data["long"]);
              }
            })
            .catch(error => {
              console.error('No connection:', error);
              check_status_ping();
            });
        }, 300);

        return () => clearInterval(interval);
      }, [connected]);
  }


  const BoardStatusPane = () => {
    // Require actual data 
    const ConnectionHandler = (name) => {
      const data = {
        comport: name
      }
      axios.post("http://127.0.0.1:5000/connect-p", data)
        .then(response => {
          const packet = response.data
          console.log('Response:', packet);
          setBoardInfo({
            firmware: packet["controller"]["firmware"],
            name: packet["controller"]["name"],
            status: packet["status"]
          })
          setConnected(true);
        })
        .catch(error => {
          console.error('Error connecting to PCB:', error);
          setConnected(false);
          setReset(reset => !reset);
        });
    }

    const DisconnectionHandler = () => {
      if (connected) {
        axios.get("http://127.0.0.1:5000/comports-d")
        .then(response => {
          setConnected(false);
        })
        .catch(error => {
          console.error('Error disconnecting:', error);
          setConnected(true);
        });
      }
    }

    const COMBoard = (name, index) => {
      return (
        <div key={index} className="flex w-full justify-between bg-red-700 p-4 rounded-lg">
          <p className="font-bold h-full text-xl">{name}</p>
          <button onClick={() => ConnectionHandler(name)} className="font-medium bg-red-600 p-2 rounded-lg hover:opacity-80 transition hover:scale-110">Connect</button>
        </div>
      )
    }


    const BoardInfomation = () => {
      return (
        <>
          <div className="flex-col">
            <p className="text-2xl font-semibold">{boardInfo["name"]}</p>
            <p className="text-xl">Firmware: {boardInfo["firmware"]}</p>
            <p className="text-xl">Status: {boardInfo["status"]}</p>
          </div>
          <button onClick={DisconnectionHandler} className="flex font-bold text-2xl bg-red-600 p-4 hover:opacity-80 transition hover:scale-105 rounded-lg">
            Disconnect
          </button>
        </>
      )
    }

    return (
      <div className="w-1/2 mb-6 p-5 bg-red-800 rounded-lg space-y-4">
        <h1 className="text-2xl font-bold">Board Status</h1>
        <div className="space-y-4">
          {/* {dummy_data.map((port) => COMBoard(port))} */}
          {!connected ? 
            boards.length === 0 ?
              <p className="text-2x1 font-bold"> No connected boards </p>
              :
              boards.map((port, index) => COMBoard(port, index))
            : 
            BoardInfomation()}
        </div>
      </div>
    )
  }

  SensorDataListener();

  const check_status_ping = () => {
    axios.get("http://127.0.0.1:5000/ping")
    .then(response => {
      console.log(response);
      setConnected(true);
    })
    .catch(error => {
      console.error('Not connected:', error);
      setConnected(false);
      setReset(!reset);
    });
  };

  const check_backend_status = () => {
    axios.get("http://127.0.0.1:5000/")
    .then(response => {
      setReset(!reset);
    })
    .catch(error => {

    })
  }

  return (
    <div className="flex h-screen w-full">
      {/* Left Side - 3D Model */}
      <div className="w-1/3 h-screen bg-gray-800 flex items-center justify-center">
        <MyThree/>
      </div>

      {/* Right Side - Scrollable Info Pane */}
      <div className="w-2/3 h-screen overflow-y-auto bg-red-900 p-6 text-white">
        <div className="flex w-full space-x-6 ">
          <DataPane/>
          <BoardStatusPane/>
        </div>        

        {/* GPS Coordinate */}
        <div className="mb-6 p-4 bg-red-800 rounded-lg">
          <h2 className="text-lg font-bold">GPS Coordinate</h2>
          <GoogleMap latitude={latitude} longitude={longitude} />
        </div>
        {/* Fourth Pane */}
        <div className="mb-6 p-4 bg-red-800 rounded-lg">
         <FourthPane />
          </div>
      </div>
    </div>
  );
}