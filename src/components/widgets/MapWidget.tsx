"use client";

import React, { useEffect, useRef, useState } from "react";
import type { FC } from "react";
import type { SensorData } from "@/components/widgets/SensorReadingWidget";


interface MapWidgetProps {
  sensorData: SensorData;
  height?: number;
  darkMode?: boolean; // passed from Dashboard to match theme
}

const lightTileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const darkTileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

export const MapWidget: FC<MapWidgetProps> = ({ sensorData, height = 300, darkMode = true }) => {
  const { lat, long } = sensorData;
  const mapRef = useRef<any | null>(null);
  const markerRef = useRef<any | null>(null);
  const tileLayerRef = useRef<any | null>(null);
  const polylineRef = useRef<any | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [showPath, setShowPath] = useState<boolean>(false);
  const [pathPoints, setPathPoints] = useState<any[]>([]);
  const [leafletLoaded, setLeafletLoaded] = useState<boolean>(false);
  const hasCenteredRef = useRef<boolean>(false);

  const isValid = Number.isFinite(lat) && Number.isFinite(long) && (lat !== 0 || long !== 0);

  useEffect(() => {
    if (!tileLayerRef.current || !mapRef.current) return;

    tileLayerRef.current.setUrl(darkMode ? darkTileUrl : lightTileUrl);
  }, [darkMode]);

  useEffect(() => {
    if (!markerRef.current || !polylineRef.current) return;

    const color = darkMode ? '#ffd966' : '#ff0000';
    markerRef.current.setStyle({
      color,
      fillColor: color,
      fillOpacity: 0.95,
    });
    polylineRef.current.setStyle({ color, weight: 3 });
  }, [darkMode]);

  // Initialize map once when component mounts. Load Leaflet dynamically to avoid SSR errors.
  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return;

    let cancelled = false;

    const init = async () => {
      try {
        const leafletModule = await import('leaflet');
        const L = leafletModule.default ?? leafletModule;

        if (cancelled) return;

        const initialCenter: any = isValid ? [lat, long] : [33.42077778, -111.92952778];
        mapRef.current = L.map(containerRef.current, {
          center: initialCenter,
          zoom: 23,
          zoomControl: true,
          attributionControl: false,
        });

        tileLayerRef.current = L.tileLayer(darkMode ? darkTileUrl : lightTileUrl, {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        }).addTo(mapRef.current);

        // Use a vector circle marker so the marker doesn't rely on external image assets
        markerRef.current = L.circleMarker(initialCenter, {
          radius: 8,
          color: darkMode ? '#ffd966' : '#ff0000',
          fillColor: darkMode ? '#ffd966' : '#ff0000',
          fillOpacity: 0.95,
        }).addTo(mapRef.current);

        // polyline (flight path)
        polylineRef.current = L.polyline([], { color: darkMode ? '#ffd966' : '#ff0000', weight: 3 }).addTo(mapRef.current);

        setLeafletLoaded(true);
      } catch (err) {
        console.error('Error loading leaflet:', err);
      }
    };

    init();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (e) {
          // ignore
        }
        mapRef.current = null;
        markerRef.current = null;
        tileLayerRef.current = null;
        polylineRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // On first valid fix: center & fit a 5-mile radius bounding box. Afterwards, only move marker and update path.
  useEffect(() => {
    if (!mapRef.current || !markerRef.current || !leafletLoaded) return;
    if (!isValid) return;

    const newLatLng = [lat, long];

    // If not yet centered on initial fix, compute a 5-mile bounding box and fit it
    if (!hasCenteredRef.current) {
      // approximate conversions
      const radiusMiles = 5;
      const degLat = radiusMiles / 69.0; // ~69 miles per degree latitude
      const degLon = radiusMiles / (69.0 * Math.cos((lat * Math.PI) / 180));

      const sw = [lat - degLat, long - degLon];
      const ne = [lat + degLat, long + degLon];

      try {
        const bounds = [sw, ne];
        // fitBounds accepts an array of corners
        mapRef.current.fitBounds(bounds, { padding: [20, 20] });
        mapRef.current.setMaxBounds(bounds);
      } catch (e) {
        try {
          mapRef.current.fitBounds([sw, ne]);
          mapRef.current.setMaxBounds([sw, ne]);
        } catch (err) {
          // ignore
        }
      }

      hasCenteredRef.current = true;
    }

    // Move marker (do NOT pan/zoom after initial centering)
    try {
      markerRef.current.setLatLng(newLatLng);
    } catch (e) {
      // marker may not be ready
    }

    // Append to path points and update polyline in same state update
    setPathPoints((prev) => {
      const next = [...prev, newLatLng];
      if (polylineRef.current) {
        try { polylineRef.current.setLatLngs(showPath ? next : []); } catch (err) { }
      }
      return next;
    });
  }, [lat, long, isValid, showPath, leafletLoaded]);

  // When showPath toggles, update polyline layer
  useEffect(() => {
    if (!polylineRef.current) return;
    try {
      if (showPath) {
        polylineRef.current.setLatLngs(pathPoints);
      } else {
        polylineRef.current.setLatLngs([]);
      }
    } catch (e) {
      // ignore
    }
  }, [showPath, pathPoints]);

  // Simple UI to toggle path visibility and show selected site
  return (
    <div className="w-full mb-6 px-6 py-5 bg-base-100/50 text-base-700 dark:bg-base-100 dark:text-highlight rounded-lg transition-colors duration-700 shadow-xl">
      <div className="flex items-start justify-between">
        <h2 className="text-lg font-bold mb-3">GPS Coordinate</h2>
        <div className="flex items-center gap-2">
          <label className="text-sm">Show path</label>
          <input type="checkbox" checked={showPath} onChange={() => setShowPath((v) => !v)} />
        </div>
      </div>

      <div style={{ height: `${height}px`, width: '100%' }} className="w-full rounded overflow-hidden relative" ref={containerRef}>
      </div>

      <div className="mt-3 text-sm flex items-center justify-between">
        <div>
          {!isValid ? (
            <div className="italic text-xs">Waiting for valid GPS coordinates from the backend...</div>
          ) : (
            <div>
              <div>Latitude: {lat.toFixed(5)} deg</div>
              <div>Longitude: {long.toFixed(5)} deg</div>
            </div>
          )}
        </div>

        <div className="text-xs italic">
          Offline tiles disabled — using OSM
        </div>
      </div>
    </div>
  );
};

export default MapWidget;
