import { useEffect, useState } from "react";

const GoogleMap = ({ latitude, longitude }) => {
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);

  useEffect(() => {
    if (!latitude || !longitude) return;

    function initMap() {
      const location = { lat: latitude, lng: longitude };

      const mapInstance = new google.maps.Map(document.getElementById("map"), {
        zoom: 10,
        center: location,
      });

      const markerInstance = new google.maps.Marker({
        position: location,
        map: mapInstance,
        title: "Flight Location",
      });

      setMap(mapInstance);
      setMarker(markerInstance);
    }

    if (window.google) {
      initMap();
    } else {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyA3P4DSZk_fxHSgzkE-ANmNrqDJQpqd7r0&callback=initMap`;
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
      script.onload = initMap;
    }
  }, []);

  useEffect(() => {
    if (map && marker) {
      const newPosition = { lat: latitude, lng: longitude };
      marker.setPosition(newPosition);
      map.setCenter(newPosition); // Optional: Center the map on the new position
    }
  }, [latitude, longitude]);

  return <div id="map" style={{ width: "100%", height: "300px" }}></div>;
};

export default GoogleMap;