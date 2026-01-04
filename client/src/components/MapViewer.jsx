
import React, { useEffect, useRef, useState } from "react";
import { GoogleMapsOverlay } from "@deck.gl/google-maps";
import { BitmapLayer } from "@deck.gl/layers";
import { TileLayer } from "@deck.gl/geo-layers";
import { fetchHeatLayer } from "../services/api";
import { useGlobalStore } from "../context/GlobalStore";



const MapViewer = () => {
  const mapRef = useRef(null);
  const overlayRef = useRef(null);
  const [tileUrl, setTileUrl] = useState(null);
  const { activeLayer, year } = useGlobalStore();


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
    if (!window.google || !mapRef.current) return;
    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 12.9716, lng: 77.5946 },
      zoom: 10,
      tilt: 0,
      heading: 0,
      mapId: "3e9ab3019d1723b1f60010f9",
      disableDefaultUI: true,
    });
    const overlay = new GoogleMapsOverlay({ layers: [] });
    overlay.setMap(map);
    overlayRef.current = overlay;
  }, []);


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