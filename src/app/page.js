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


export default function Home() {
  // for data gauges
  // State variables for the flight data (initial values are placeholders)
  const [accelerationX, setAccelerationX] = useState(0);
  const [accelerationY, setAccelerationY] = useState(0);
  const [accelerationZ, setAccelerationZ] = useState(0);
  const [gyroscopeX, setGyroscopeX] = useState(0);
  const [gyroscopeY, setGyroscopeY] = useState(0);
  const [gyroscopeZ, setGyroscopeZ] = useState(0);
  const [pitch, setPitch] = useState(0);
  const [pitchRate, setPitchRate] = useState(0);
  const [roll, setRoll] = useState(0);
  const [rollRate, setRollRate] = useState(0);
  const [barometer, setBarometer] = useState(0);
  const [pressure, setPressure] = useState(0);
  const [velocity, setVelocity] = useState(0);
  const [altitude, setAltitude] = useState(0);
  const [chipTemperature, setChipTemperature] = useState(0);

  const [comports, setComports] = useState([]);

  // for google map  33.420659, -111.929530
  const [longitude, setLongitude] = useState(-111.929530);
  const [latitude, setLatitude] = useState(33.420659);
  const [connected, setConnected] = useState(false);

  // React states for boards
  const [boards, setBoards] = useState([]);

  useEffect(() => {
    axios.get('http://127.0.0.1:5000/comports-l')
      .then(response => {
        console.log('Boards:', response.data);
        setBoards(response.data)
      })
      .catch(error => {
        console.error('Error fetching board data, please check your backend:', error);
      });
  },[])

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
          </div>
      </div>
    )
  }

  const BoardStatusPane = () => {
    // Require actual data 
    const ConnectionHandler = () => {
      setConnected(true);
    }

    const DisconnectionHandler = () => {
      setConnected(false);
    }

    const COMBoard = (name) => {
      return (
        <div className="flex w-full justify-between bg-red-700 p-4 rounded-lg">
          <p className="font-bold h-full text-xl">{name}</p>
          <button onClick={ConnectionHandler} className="font-medium bg-red-600 p-2 rounded-lg hover:opacity-80 transition hover:scale-110">Connect</button>
        </div>
      )
    }


    const BoardInfomation = () => {
      const dummy_pcb_name = "Flight Computer"
      const dummy_firmware_name = "Data Logger Rev 2"
      const dummy_status = "Ready"

      return (
        <>
          <div className="flex-col">
            <p className="text-2xl font-semibold">{dummy_pcb_name}</p>
            <p className="text-xl">Firmware: {dummy_firmware_name}</p>
            <p className="text-xl">Status: {dummy_status}</p>
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
          {!connected ? boards.map((port) => COMBoard(port)) : BoardInfomation()}
        </div>
      </div>
    )
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
      </div>
    </div>
  );
}
