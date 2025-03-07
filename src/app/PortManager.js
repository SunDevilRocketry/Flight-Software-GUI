// PortManager.js
import React, { useState } from "react";

const PortManager = () => {
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = () => {
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

  return (
    <div style={containerStyle}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Board Status</h2>
      <div style={rowStyle}>
        <div>COM 1</div>
        <button onClick={handleConnect} style={buttonStyle}>
          Connect
        </button>
      </div>
      <div style={rowStyle}>
        <div>COM 2</div>
        <button onClick={handleConnect} style={buttonStyle}>
          Connect
        </button>
      </div>
      <div style={rowStyle}>
        <div>COM 3</div>
        <button onClick={handleConnect} style={buttonStyle}>
          Connect
        </button>
      </div>
    </div>
  );
};

export default PortManager;
