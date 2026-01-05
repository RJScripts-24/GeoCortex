import React, { useEffect, useRef, useState } from "react";
import { GoogleMapsOverlay } from "@deck.gl/google-maps";
import { BitmapLayer } from "@deck.gl/layers";
import { TileLayer } from "@deck.gl/geo-layers";
import { fetchHeatLayer } from "../services/api";
import { useGlobalStore } from "../context/GlobalStore";
import html2canvas from "html2canvas";

const MapViewer = ({ moveTo }) => {
  const mapRef = useRef(null);
  const overlayRef = useRef(null);

  const [tileUrl, setTileUrl] = useState(null);
  const [menuPos, setMenuPos] = useState(null);
  const [clickedLatLng, setClickedLatLng] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);

  const {
    activeLayer,
    year,
    setShowConsultant,
    setAnalysis,                // UI HTML
    setStructuredAnalysis,      //  PDF JSON
    setIsAnalyzing,
    setClickedLocation,
    setMapImage,
  } = useGlobalStore();

  // ───────── Fetch Heat Tiles ─────────
  useEffect(() => {
    if (activeLayer !== "heat") return;
    fetchHeatLayer(year)
      .then((data) => setTileUrl(data?.tileUrl || null))
      .catch(() => setTileUrl(null));
  }, [year, activeLayer]);

  // ───────── Initialize Map ─────────
  useEffect(() => {
    if (!window.google || !mapRef.current || mapInstance) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 12.9716, lng: 77.5946 },
      zoom: 10,
      mapId: "3e9ab3019d1723b1f60010f9",
      disableDefaultUI: true,
    });

    map.addListener("contextmenu", (e) => {
      if (e.latLng && e.domEvent) {
        setClickedLatLng({
          lat: e.latLng.lat(),
          lng: e.latLng.lng(),
        });
        setMenuPos({
          x: e.domEvent.clientX,
          y: e.domEvent.clientY,
        });
      }
    });

    setMapInstance(map);

    const overlay = new GoogleMapsOverlay({ layers: [] });
    overlay.setMap(map);
    overlayRef.current = overlay;
  }, [mapInstance]);

  // ───────── Move To Search Result ─────────
  useEffect(() => {
    if (moveTo && mapInstance) {
      mapInstance.setCenter({
        lat: parseFloat(moveTo.lat),
        lng: parseFloat(moveTo.lng),
      });
      mapInstance.setZoom(14);
    }
  }, [moveTo, mapInstance]);

  // ───────── Overlay Heatmap ─────────
  useEffect(() => {
    if (!overlayRef.current) return;

    if (activeLayer === "heat" && tileUrl) {
      const heatLayer = new TileLayer({
        id: "heatmap",
        data: tileUrl,
        tileSize: 256,
        opacity: 0.8,
        renderSubLayers: (props) => {
  const { west, south, east, north } = props.tile.bbox;

   return new BitmapLayer({
    ...props,                  
    image: props.data,
    bounds: [west, south, east, north],
    data: [0],                    
    opacity: 0.8,
  });
},

      });
      overlayRef.current.setProps({ layers: [heatLayer] });
    } else {
      overlayRef.current.setProps({ layers: [] });
    }
  }, [activeLayer, tileUrl]);

  // ───────── ANALYZE NOW ─────────
  const handleAnalyzeNow = async () => {
    setShowConsultant(true);
    setMenuPos(null);
    setIsAnalyzing(true);

    const lat = clickedLatLng?.lat || 12.9716;
    const lng = clickedLatLng?.lng || 77.5946;

    setClickedLocation({ lat, lng });

    // Capture map snapshot
    try {
      const canvas = await html2canvas(mapRef.current, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#000",
      });
      setMapImage(canvas.toDataURL("image/png"));
    } catch {}

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng }),
      });

      if (res.ok) {
        const data = await res.json();

        //  UI HTML
        setAnalysis(data.analysis || "");

        //  STRUCTURED JSON FOR PDF
        if (data.structured_analysis) {
          setStructuredAnalysis(data.structured_analysis);
        }
      } else {
        setAnalysis("Analysis failed.");
      }
    } catch {
      setAnalysis("Server error during analysis.");
    }

    setIsAnalyzing(false);
  };

  // ───────── Hide Menu on Click ─────────
  useEffect(() => {
    const hide = () => setMenuPos(null);
    window.addEventListener("click", hide);
    return () => window.removeEventListener("click", hide);
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
      />

      {menuPos && (
        <div
          style={{
            position: "fixed",
            top: menuPos.y,
            left: menuPos.x,
            zIndex: 9999,
            background: "white",
            borderRadius: 8,
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            style={{
              padding: "8px 16px",
              fontWeight: "bold",
              cursor: "pointer",
              border: "none",
              background: "none",
              color: "#06b6d4",
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
