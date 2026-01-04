import React, { useEffect, useRef } from "react";
import { GoogleMapsOverlay } from "@deck.gl/google-maps";
import { BitmapLayer } from "@deck.gl/layers";

const MapViewer = () => {
  const mapRef = useRef(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!window.google || !mapRef.current) return;

    
    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 12.9716, lng: 77.5946 },
      zoom: 17,              
      tilt: 67,              
      heading: 0,
      mapId: "3e9ab3019d1723b1f60010f9", 
      disableDefaultUI: true,
    });

    
    const overlay = new GoogleMapsOverlay({
      layers: [],
    });

    overlay.setMap(map);
    overlayRef.current = overlay;

    
    const heatLayer = new BitmapLayer({
      id: "bengaluru-heat",
      image: "/bengaluru_heat.png", 
      bounds: [77.45, 12.85, 77.75, 13.15],
      opacity: 1,
    });

    overlay.setProps({
      layers: [heatLayer],
    });

    console.log("✅ 3D Map + Heatmap initialized");

  }, []);

  return (
    <div
      ref={mapRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100vw",
        height: "100vh",
        background: "black",
      }}
    />
  );
};

export default MapViewer;