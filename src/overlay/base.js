"use client";

import { useEffect, useState } from "react";

export default function OverlayBase() {
  const METERS_TO_FEET = 3.28084;
  const MIN_ALTITUDE = 0;
  const MAX_ALTITUDE = 20000;
  const MAX_ALTITUDE_METERS = MAX_ALTITUDE / METERS_TO_FEET;
  const TEST_PERIOD_MS = 20000;
  const TEST_HZ = 60;

  const [sensorData, setSensorData] = useState({ altitude: 0 });

  useEffect(() => {
    const cubicBezier = (t, p0, p1, p2, p3) => {
      const u = 1 - t;
      return (
        u * u * u * p0 +
        3 * u * u * t * p1 +
        3 * u * t * t * p2 +
        t * t * t * p3
      );
    };

    const bezierEase = (t) => cubicBezier(t, 0, 0.2, 0.8, 1);
    const intervalMs = 1000 / TEST_HZ;

    const intervalId = setInterval(() => {
      const now = Date.now();
      const cycleProgress = (now % TEST_PERIOD_MS) / TEST_PERIOD_MS;
      const trianglePhase =
        cycleProgress < 0.5 ? cycleProgress * 2 : (1 - cycleProgress) * 2;
      const curvedProgress = bezierEase(trianglePhase);
      const altitude = curvedProgress * MAX_ALTITUDE_METERS;
      setSensorData({ altitude });
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [MAX_ALTITUDE_METERS]);

  const rawAltitudeMeters = Number(sensorData.altitude) || 0;
  const rawAltitudeFeet = rawAltitudeMeters * METERS_TO_FEET;
  const altitude = Math.min(Math.max(rawAltitudeFeet, MIN_ALTITUDE), MAX_ALTITUDE);
  const fillPercent = ((altitude - MIN_ALTITUDE) / (MAX_ALTITUDE - MIN_ALTITUDE)) * 100;
  const fillCapRadius = fillPercent >= 99.5 ? "999px" : "0 0 999px 999px";
  const tickValues = Array.from({ length: MAX_ALTITUDE / 1000 + 1 }, (_, index) => index * 1000);

  return (
    <main
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh"
      }}
    >
      <div
        style={{
          position: "fixed",
          top: "2rem",
          bottom: "2rem",
          left: "2rem",
          width: "10rem"
        }}
      >
        <div
          aria-label="Altitude indicator"
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: "1rem",
            border: "1px solid rgba(255, 255, 255, 0.6)",
            borderRadius: "999px",
            background: "rgba(255, 255, 255, 0.08)",
            opacity: "var(--overlay-transparency)",
            display: "flex",
            alignItems: "flex-end",
            overflow: "hidden"
          }}
      >
          {tickValues.map((tickValue) => {
            const tickPercent = ((tickValue - MIN_ALTITUDE) / (MAX_ALTITUDE - MIN_ALTITUDE)) * 100;
            return (
              <div
                key={tickValue}
                style={{
                  position: "absolute",
                  left: 0,
                  width: "0.3rem",
                  height: "1px",
                  background: "rgba(255, 255, 255, 0.65)",
                  bottom: `${tickPercent}%`,
                  transform: tickValue === MAX_ALTITUDE ? "translateY(0)" : "translateY(50%)"
                }}
              />
            );
          })}
          <div
            style={{
              width: "100%",
              height: `${fillPercent}%`,
              background: "rgba(255, 255, 255, 0.9)",
              borderRadius: fillCapRadius
            }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            left: "3.25rem",
            top: `clamp(0.5rem, calc(${100 - fillPercent}% - 1.25rem), calc(100% - 3rem))`,
            color: "rgba(20, 20, 20, 0.95)",
            opacity: "var(--overlay-transparency)",
            fontFamily: "Inter, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
            fontSize: "0.95rem",
            lineHeight: 1.2,
            border: "1px solid rgba(255, 255, 255, 0.7)",
            borderRadius: "0.75rem",
            background: "rgba(245, 245, 245, 0.92)",
            padding: "0.55rem 0.75rem",
            minWidth: "5.75rem",
            textAlign: "center",
            whiteSpace: "nowrap"
          }}
        >
          ALT {Math.round(altitude)} ft
        </div>
      </div>
      <img
        src="/shared/sdr_logo.png"
        alt="SDR"
        style={{
          position: "fixed",
          top: "2rem",
          right: "2rem",
          width: "20vw",
          maxWidth: "320px",
          minWidth: "120px",
          opacity: "var(--overlay-transparency)"
        }}
      />
    </main>
  );
}
