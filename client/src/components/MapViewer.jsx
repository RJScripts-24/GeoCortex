
import React, { useEffect, useRef, useState } from "react";
import { GoogleMapsOverlay } from "@deck.gl/google-maps";
import { BitmapLayer } from "@deck.gl/layers";
import { TileLayer } from "@deck.gl/geo-layers";
import { fetchHeatLayer } from "../services/api";
import { useGlobalStore } from "../context/GlobalStore";



const MapViewer = ({ moveTo }) => {
  const mapRef = useRef(null);
  const overlayRef = useRef(null);
  const [tileUrl, setTileUrl] = useState(null);
  const [menuPos, setMenuPos] = useState(null);
  const { activeLayer, year, setShowConsultant, setAnalysis, setIsAnalyzing } = useGlobalStore();
  const [clickedLatLng, setClickedLatLng] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);


  // Fetch heatmap tile URL when year changes (for thermal view)
  useEffect(() => {
    if (activeLayer !== 'heat') return;
    fetchHeatLayer(year)
      .then((data) => {
        if (data.tileUrl) {
          setTileUrl(data.tileUrl);
        } else {
          setTileUrl(null);
        }
      })
      .catch(() => setTileUrl(null));
  }, [year, activeLayer]);

  // Initialize map only once
  useEffect(() => {
    if (!window.google || !mapRef.current || mapInstance) return;
    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 12.9716, lng: 77.5946 },
      zoom: 10,
      tilt: 0,
      heading: 0,
      mapId: "3e9ab3019d1723b1f60010f9",
      disableDefaultUI: true,
    });
    // Add listener to capture clicked coordinates
    map.addListener('contextmenu', (e) => {
      if (e.latLng) {
        setClickedLatLng({ lat: e.latLng.lat(), lng: e.latLng.lng() });
      }
    });
    setMapInstance(map);
    const overlay = new GoogleMapsOverlay({ layers: [] });
    overlay.setMap(map);
    overlayRef.current = overlay;
  }, [mapInstance]);

  // Move map to searched location
  useEffect(() => {
    if (moveTo && mapInstance && moveTo.lat && moveTo.lng) {
      mapInstance.setCenter({ lat: parseFloat(moveTo.lat), lng: parseFloat(moveTo.lng) });
      mapInstance.setZoom(14);
    }
  }, [moveTo, mapInstance]);

  // Update map layers based on activeLayer
  useEffect(() => {
    if (!overlayRef.current) return;

    if (activeLayer === 'heat' && tileUrl) {
      // Show only heatmap
      const heatLayer = new TileLayer({
        id: 'heatmap-layer',
        data: tileUrl,
        minZoom: 0,
        maxZoom: 19,
        tileSize: 256,
        opacity: 0.8,
        renderSubLayers: (props) => {
          const {
            bbox: { west, south, east, north }
          } = props.tile;
          return new BitmapLayer(props, {
            data: null,
            image: props.data,
            bounds: [west, south, east, north],
          });
        },
      });
      overlayRef.current.setProps({ layers: [heatLayer] });
    } else {
      // Satellite view: remove all overlays (show only base map)
      overlayRef.current.setProps({ layers: [] });
    }
  }, [activeLayer, tileUrl]);

  // Handle right-click to show context menu
  const handleContextMenu = (e) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
  };

  // Handle Analyze Now click
  const handleAnalyzeNow = async () => {
    setShowConsultant(true);
    setMenuPos(null);
    let lat = clickedLatLng?.lat;
    let lng = clickedLatLng?.lng;
    if (!lat || !lng) {
      lat = 12.9716;
      lng = 77.5946;
    }
    // Only allow heat analysis in Thermal X-Ray mode
    if (activeLayer !== 'heat') {
      setAnalysis(
        `<div style="font-size:1.2rem;font-weight:bold;line-height:2;">🗺️ <span style='font-size:1.3rem;'>Coordinates Selected</span></div><div style="margin-top:1rem;"><div style="font-size:1.1rem;font-weight:bold;">📍 Coordinates:</div><div style="font-size:1rem;margin-bottom:0.5rem;">${lat.toFixed(4)}, ${lng.toFixed(4)}</div><div style="color:#f87171;font-size:1rem;margin-top:1rem;">For heat analysis kindly switch to <b>Thermal X-Ray</b> mode.</div></div>`
      );
      setIsAnalyzing(false);
      return;
    }
    setIsAnalyzing(true);
    try {
      // Fetch Gemini analysis and temperature from backend
      const analysisRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng })
      });
      let aiText = '';
      let temp = null;
      let locationName = 'Unknown Location';
      if (analysisRes.ok) {
        const aiData = await analysisRes.json();
        aiText = aiData.analysis;
        temp = aiData.temperature;
        locationName = aiData.location_name || 'Unknown Location';
      }
      // Compose result with rich formatting and emojis
      let result = `<div style="font-size:1.5rem;font-weight:bold;line-height:2;">🌡️ <span style='font-size:2rem;'>Urban Heat Analysis</span></div><div style="margin-top:1rem;"><div style="font-size:1.1rem;font-weight:bold;">📍 Location:</div><div style="font-size:1rem;margin-bottom:0.5rem;">${locationName}</div><div style="font-size:0.85rem;color:#888;margin-bottom:0.5rem;"><b>Coordinates:</b> ${lat.toFixed(4)}, ${lng.toFixed(4)}</div><div style="font-size:1.1rem;font-weight:bold;">🔥 Land Surface Temperature:</div><div style="font-size:1.3rem;color:#f59e42;font-weight:bold;margin-bottom:0.5rem;">${temp !== null ? temp + '°C' : 'N/A'}</div></div><div style="font-size:1.1rem;font-weight:bold;margin-top:1rem;">🤖 AI Insights:</div><div style="font-size:1rem;line-height:1.6;margin-top:0.5rem;">${aiText.replace(/\n/g, '<br/>')}</div>`;
      setAnalysis(result);
    } catch (err) {
      setAnalysis('Failed to fetch analysis. Please try again.');
    }
    setIsAnalyzing(false);
  };

  // Hide menu on click elsewhere
  useEffect(() => {
    const hideMenu = () => setMenuPos(null);
    window.addEventListener('click', hideMenu);
    return () => window.removeEventListener('click', hideMenu);
  }, []);

  return (
    <>
      <div
        ref={mapRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100vw",
          height: "100vh",
          background: "black",
        }}
        onContextMenu={handleContextMenu}
      />
      {menuPos && (
        <div
          style={{
            position: 'fixed',
            top: menuPos.y,
            left: menuPos.x,
            zIndex: 1000,
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            padding: '8px 0',
            minWidth: '140px',
          }}
        >
          <button
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              padding: '8px 16px',
              textAlign: 'left',
              cursor: 'pointer',
              fontWeight: 'bold',
              color: '#06b6d4',
            }}
            onClick={handleAnalyzeNow}
          >
            Analyze Now
          </button>
        </div>
      )}
    </>
  );
};

export default MapViewer;