import { useEffect } from "react";

const GoogleMap = ({ latitude, longitude }) => {
  useEffect(() => {
    if (!latitude || !longitude) return;

    function initMap() {
      const location = { lat: latitude, lng: longitude };

      const map = new google.maps.Map(document.getElementById("map"), {
        zoom: 10,
        center: location,
      });

      new google.maps.Marker({
        position: location,
        map: map,
        title: "Flight Location",
      });
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
  }, [latitude, longitude]);

  return <div id="map" style={{ width: "100%", height: "400px" }}></div>;
};

export default GoogleMap;