"use client"
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
//import MyThree from './Three';
import MyThree from '@/components/Three';
import RocketSilhouette from '@/components/RocketScene';
import axios from "axios";
// import PortManager from "./PortManager";
//import RocketScene from "@/components/RocketScene";

export default function Home() {

  // for div 1
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


  // for div 4
  const [slider, setSlider] = useState(0); // State to track the slider value

  const StatusBox = ({ num }) => {
    // const bgColor = status === "good" ? "bg-green-500" : "bg-red-500";
    // adkfasndkfa jsdlkjfahsdl kjfahsdlk fahsdklj fadli lj lk 
    const statusMap = {
      100: "Bad",
      200: "Bad",
      300: "Bad",
      400: "Good",
      500: "Good",
      600: "Good"
    };
    const colorMap = {
      100: "bg-[#ED3716]",
      200: "bg-[#EDA216]",
      300: "bg-[#EDED16]",
      400: "bg-[#A9ED16]",
      500: "bg-[#74ED16]",
      600: "bg-[#47ED16]"
    };
    const color = colorMap[num];
    const status = statusMap[num];
    return (
      <div className={`w-48 h-24 ${color} text-white flex items-center justify-center rounded-lg`}>
        {status === "Good" ? "✅ Good" : "❌ Bad"}
      </div>
    );
  };

  useEffect(() => {
    axios.get("http://127.0.0.1:5000/comports-l")
    .then(function (response) {
      setComports(response.data)
    })
    .catch(function (error){
      console.log(error)
    })
  }, [])

  const PortManager = () => {
    const [isConnected, setIsConnected] = useState(false);

    const handleConnect = (comport) => {
      axios.post("http://127.0.0.1:5000/connect-p", {
        "comport": comport
      })
      .then(function (response) {
        console.log(response);
      })
      .catch(function (error) {
        console.log(error);
      });

      setIsConnected(true);
    };
  
    const handleDisconnect = () => {
      setIsConnected(false);
    };
  
    // Fixed container style for constant height and centering.
    const containerStyle = {
      width: "350px",
      height: "300px",         // Fixed height to prevent resizing
      border: "2px solid #333",
      borderRadius: "6px",
      padding: "20px",
      margin: "0 auto",        // Centers horizontally within its parent
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      boxSizing: "border-box",
    };
  
    // Each row is styled as a bordered rectangle.
    const rowStyle = {
      border: "2px solid #333",
      borderRadius: "6px",
      padding: "10px",
      marginBottom: "10px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
      boxSizing: "border-box",
    };
  
    // Style for the Connect/Disconnect button with a light gray background and black text.
    const buttonStyle = {
      border: "2px solid black",
      borderRadius: "4px",
      padding: "5px 10px",
      backgroundColor: "lightgray",
      color: "black",
      cursor: "pointer",
      fontWeight: "bold",
    };
  
    if (isConnected) {
      return (
        <div style={containerStyle}>
          <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Board Status</h2>
          <div>Board Name: Name</div>
          <div>Firmware: Terminal</div>
          <div>Status: Success</div>
          <button onClick={handleDisconnect} style={{ ...buttonStyle, marginTop: "20px" }}>
            Disconnect
          </button>
        </div>
      );
    }
  

    function comportBar(comport) {
      return (
        <div key={comport} style={rowStyle}>
          <div>{comport}</div>
          <button onClick={() => handleConnect(comport)}>Connect</button>
        </div>
      )
    }
    return (
      <div  style={containerStyle}>
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Board Status</h2>
          {comports.map((port)=>{
            return comportBar(port)
          })}
      </div>
    );
  };
  

  return (
    <div className="grid grid-cols-3 gap-6 w-full h-screen bg-gray-700 p-6">
      <div className="bg-red-700 flex flex-col items-center justify-center">Data gauges
        <h1 className="text-2xl font-bold">Display flight data</h1>
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
            <p>Chip Temperature: {chipTemperature}</p>
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

      <div className="bg-red-600 "> 
        <p>3D silhouette map</p>
      </div>

      <div className="bg-red-400 w-full h-full">
        <p>Rocket Orientation View</p>
        <MyThree/>
      </div>

      <div className="bg-red-900">
        <PortManager />
      </div>

      <div className="bg-red-600 ">
        <p>GPS Coordinate</p>
      </div>

      <div className="bg-red-600">
        <p>Control Buttons</p>
      </div>
    </div>
  );
}
