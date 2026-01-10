import React, { useEffect, useRef, useState } from "react";
import { GoogleMapsOverlay } from "@deck.gl/google-maps";
import { BitmapLayer } from "@deck.gl/layers";
import { TileLayer } from "@deck.gl/geo-layers";
import { fetchHeatLayer } from "../services/api";
import { useGlobalStore } from "../context/GlobalStore";
import { API_BASE_URL } from '../config/api.js';



const MapViewer = ({ mapView, planningTrigger, setPlanningTrigger, onViewChange }) => {
  // Planning Mode selection state
  const [selectingRegion, setSelectingRegion] = useState(false);
  const selectingRegionRef = useRef(false);
  useEffect(() => { selectingRegionRef.current = selectingRegion; }, [selectingRegion]);
  const [regionRect, setRegionRect] = useState(null);
  const regionOverlayRef = useRef(null);
  const mapRef = useRef(null);
  const overlayRef = useRef(null);
  const [tileUrl, setTileUrl] = useState(null);
  const [menuPos, setMenuPos] = useState(null);
  const { activeLayer, year, setShowConsultant, setAnalysis, setIsAnalyzing, setClickedLocation, setMapImage, setAnalysisView } = useGlobalStore();
  const [clickedLatLng, setClickedLatLng] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const isUpdatingRef = useRef(false);
  const lastProgrammaticUpdateRef = useRef(0);


  // Fetch heatmap tile URL when year changes (for thermal view)
  useEffect(() => {
    if (activeLayer !== 'heat') return;
    console.log('[MapViewer] Fetching heat layer for year:', year);
    fetchHeatLayer(year)
      .then((data) => {
        console.log('[MapViewer] Heat layer data received:', data);
        if (data.tileUrl) {
          setTileUrl(data.tileUrl);
        } else {
          setTileUrl(null);
        }
      })
      .catch((err) => {
        console.error('[MapViewer] Failed to fetch heat layer:', err);
        setTileUrl(null);
      });
  }, [year, activeLayer]);

  // Initialize map only once
  useEffect(() => {
    if (!window.google || !mapRef.current || mapInstance) return;
    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: mapView.lat, lng: mapView.lng },
      zoom: mapView.zoom,
      tilt: 0,
      heading: 0,
      mapId: "3e9ab3019d1723b1f60010f9",
      disableDefaultUI: true,
      gestureHandling: 'greedy',
    });
    setMapInstance(map);
    const overlay = new GoogleMapsOverlay({ layers: [] });
    overlay.setMap(map);
    overlayRef.current = overlay;

    // Region selection logic
    let startLatLng = null;
    let regionRectObj = null;
    let isSelecting = false;
    let mouseDownButton = null;

    map.addListener('mousedown', (e) => {
      if (selectingRegionRef.current && e.domEvent.button === 2) {
        console.log('[PlanningMode] Right mouse down: Start region selection');
        // Prevent default right-click behavior and stop map panning
        e.domEvent.preventDefault();
        e.domEvent.stopPropagation();
        e.stop();
        // Disable map dragging during selection
        map.setOptions({ draggable: false, zoomControl: false });
        isSelecting = true;
        mouseDownButton = 2;
        startLatLng = e.latLng;
        if (regionRectObj) regionRectObj.setMap(null);
        regionRectObj = new window.google.maps.Rectangle({
          strokeColor: '#FFD600',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#FFD600',
          fillOpacity: 0.3,
          map,
          bounds: new window.google.maps.LatLngBounds(startLatLng, startLatLng),
        });
        regionOverlayRef.current = regionRectObj;
      } else if (!selectingRegionRef.current && e.domEvent.button === 0) {
        // Left mouse button: allow panning
        mouseDownButton = 0;
        isSelecting = false;
        console.log('[PlanningMode] Left mouse down: Pan map');
      } else {
        console.log('[PlanningMode] Mouse down ignored. selectingRegion:', selectingRegionRef.current, 'button:', e.domEvent.button);
      }
    });

    map.addListener('mousemove', (e) => {
      if (!isSelecting || !startLatLng || !regionRectObj) {
        return;
      }
      const endLatLng = e.latLng;
      const bounds = new window.google.maps.LatLngBounds(startLatLng, endLatLng);
      regionRectObj.setBounds(bounds);
      console.log('[PlanningMode] Region selection: updating rectangle bounds');
    });

    map.addListener('mouseup', (e) => {
      if (!isSelecting || !startLatLng || !regionRectObj) {
        return;
      }
      console.log('[PlanningMode] Mouse up detected, mouseDownButton:', mouseDownButton);
      if (mouseDownButton !== 2) {
        console.log('[PlanningMode] mouseUpHandler: Not right mouse button, ignoring');
        isSelecting = false;
        mouseDownButton = null;
        return;
      }
      const endLatLng = e.latLng;
      const bounds = new window.google.maps.LatLngBounds(startLatLng, endLatLng);
      regionRectObj.setBounds(bounds);
      // Calculate bounds
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      // Re-enable map dragging
      map.setOptions({ draggable: true, zoomControl: false });
      // Clean up
      setSelectingRegion(false);
      isSelecting = false;
      mouseDownButton = null;
      if (typeof setPlanningTrigger === 'function') setPlanningTrigger(false);
      console.log('[PlanningMode] Region selected. Redirecting to planning:', ne.lat(), sw.lat(), ne.lng(), sw.lng());
      window.location.href = `/planning?n=${ne.lat()}&s=${sw.lat()}&e=${ne.lng()}&w=${sw.lng()}`;
    });

    // Add right-click context menu handler (when NOT in planning mode)
    map.addListener('rightclick', (e) => {
      // Only show context menu if NOT in planning/region selection mode
      if (!selectingRegionRef.current) {
        e.domEvent.preventDefault();
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setClickedLatLng({ lat, lng });
        setMenuPos({ x: e.domEvent.clientX, y: e.domEvent.clientY });
        console.log('[MapViewer] Right-click context menu shown at:', lat, lng);
      }
    });
  }, [mapInstance]);
  // Listen for planningTrigger prop
  useEffect(() => {
    if (typeof planningTrigger !== 'undefined' && planningTrigger) {
      setSelectingRegion(true);
      console.log('[PlanningMode] planningTrigger activated, enabling region selection');
    }
  }, [planningTrigger]);

  // Update map when mapView changes (from external source or 3D map)
  useEffect(() => {
    if (!mapInstance || !mapView) return;

    // Validate that lat and lng are valid numbers
    const lat = parseFloat(mapView.lat);
    const lng = parseFloat(mapView.lng);
    const zoom = parseFloat(mapView.zoom);

    if (!isFinite(lat) || !isFinite(lng) || !isFinite(zoom)) {
      console.warn('Invalid mapView values:', { lat: mapView.lat, lng: mapView.lng, zoom: mapView.zoom });
      return;
    }

    isUpdatingRef.current = true;
    lastProgrammaticUpdateRef.current = Date.now();
    const currentCenter = mapInstance.getCenter();
    const currentZoom = mapInstance.getZoom();

    // Only update if values actually changed
    const centerChanged = !currentCenter ||
      Math.abs(currentCenter.lat() - lat) > 0.0001 ||
      Math.abs(currentCenter.lng() - lng) > 0.0001;
    const zoomChanged = currentZoom !== zoom;

    if (centerChanged || zoomChanged) {
      mapInstance.setCenter({ lat, lng });
      mapInstance.setZoom(zoom);
    }

    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 100);
  }, [mapView, mapInstance]);

  // Report view changes to parent (for syncing with 3D map)
  useEffect(() => {
    if (!mapInstance || !onViewChange) return;
    let debounceTimeout = null;

    const handleIdle = () => {
      // Ignore idle events that occur within 300ms of a programmatic update
      const now = Date.now();
      if (isUpdatingRef.current || now - lastProgrammaticUpdateRef.current < 300) return;

      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        const center = mapInstance.getCenter();
        const zoom = mapInstance.getZoom();
        onViewChange({
          lat: center.lat(),
          lng: center.lng(),
          zoom
        });
      }, 300);
    };

    mapInstance.addListener('idle', handleIdle);
    return () => {
      clearTimeout(debounceTimeout);
      if (window.google && window.google.maps && window.google.maps.event) {
        window.google.maps.event.clearListeners(mapInstance, 'idle');
      }
    };
  }, [mapInstance, onViewChange]);

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

    // Store clicked location
    setClickedLocation({ lat, lng });

    // Store active map view for report generation
    if (mapRef.current && mapInstance) {
      const zoom = mapInstance.getZoom();
      const center = mapInstance.getCenter();
      setAnalysisView({
        lat: center.lat(),
        lng: center.lng(),
        zoom: zoom
      });
      // Clear any old screenshots to ensure static map is used
      setMapImage(null);
    }

    // Only allow heat analysis in Thermal X-Ray mode
    if (activeLayer !== 'heat') {
      // Fetch location name even in non-thermal mode
      setIsAnalyzing(true);
      try {
        const analysisRes = await fetch(`${API_BASE_URL}/api/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lng })
        });
        let locationName = 'Unknown Location';
        if (analysisRes.ok) {
          const aiData = await analysisRes.json();
          locationName = aiData.location_name || 'Unknown Location';
        }
        // Show coordinates and location name with message to switch mode
        setAnalysis(
          `<div style="font-size:1.2rem;font-weight:bold;line-height:2;">🗺️ <span style='font-size:1.3rem;'>Coordinates Selected</span></div><div style="margin-top:1rem;"><div style="font-size:1.1rem;font-weight:bold;">📍 Location:</div><div style="font-size:1rem;margin-bottom:0.5rem;">${locationName}</div><div style="font-size:0.85rem;color:#888;margin-bottom:0.5rem;"><b>Coordinates:</b> ${lat.toFixed(4)}, ${lng.toFixed(4)}</div><div style="color:#f87171;font-size:1rem;margin-top:1rem;">For heat analysis kindly switch to <b>Thermal X-Ray</b> mode.</div></div>`
        );
      } catch (err) {
        // If API fails, show coordinates only
        setAnalysis(
          `<div style="font-size:1.2rem;font-weight:bold;line-height:2;">🗺️ <span style='font-size:1.3rem;'>Coordinates Selected</span></div><div style="margin-top:1rem;"><div style="font-size:1.1rem;font-weight:bold;">📍 Coordinates:</div><div style="font-size:1rem;margin-bottom:0.5rem;">${lat.toFixed(4)}, ${lng.toFixed(4)}</div><div style="color:#f87171;font-size:1rem;margin-top:1rem;">For heat analysis kindly switch to <b>Thermal X-Ray</b> mode.</div></div>`
        );
      }
      setIsAnalyzing(false);
      return;
    }

    // Perform heat analysis only in Thermal X-Ray mode
    setIsAnalyzing(true);
    try {
      // Fetch AI consultant analysis and temperature from backend
      const analysisRes = await fetch(`${API_BASE_URL}/api/analyze`, {
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
    const hideMenu = () => {
      console.log('[DEBUG] Hiding menu');
      setMenuPos(null);
    };
    window.addEventListener('click', hideMenu);
    return () => window.removeEventListener('click', hideMenu);
  }, []);

  // Debug: log menuPos changes
  useEffect(() => {
    console.log('[DEBUG] menuPos changed:', menuPos);
  }, [menuPos]);

  return (
    <div className="w-full h-full border-8 border-black rounded-xl box-border" style={{ boxSizing: 'border-box', position: 'relative' }}>
      <div
        ref={mapRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          background: "black",
        }}
      />
      {menuPos && (
        <div
          style={{
            position: 'fixed',
            top: menuPos.y,
            left: menuPos.x,
            zIndex: 9999,
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            padding: '8px 0',
            minWidth: '140px',
          }}
          onClick={(e) => e.stopPropagation()}
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
    </div>
  );
};

export default MapViewer;