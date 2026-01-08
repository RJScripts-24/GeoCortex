import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { GoogleMapsOverlay } from '@deck.gl/google-maps';
import { ScatterplotLayer, IconLayer } from '@deck.gl/layers';
import { generatePlanningPDF } from '../utils/pdfGenerator';

const ASSETS = [
  { label: 'Plant', file: 'Plant.glb', icon: '🌱', scale: 10 },
  { label: 'Building', file: 'Large%20Building.glb', icon: '🏢', scale: 1 },
  { label: 'Pond', file: 'Pond.glb', icon: '💧', scale: 5 },
  { label: 'Road', file: 'Road.glb', icon: '🛣️', scale: 3 },
  { label: 'Tree', file: 'Tree.glb', icon: '🌳', scale: 10 },
];

function getQueryParams(search) {
  const params = new URLSearchParams(search);
  const rawN = parseFloat(params.get('n'));
  const rawS = parseFloat(params.get('s'));
  const rawE = parseFloat(params.get('e'));
  const rawW = parseFloat(params.get('w'));

  // Normalize bounds to ensure north >= south and east >= west
  return {
    n: Math.max(rawN, rawS),
    s: Math.min(rawN, rawS),
    e: Math.max(rawE, rawW),
    w: Math.min(rawE, rawW),
  };
}

const PlanningMode = () => {
  const location = useLocation();
  const mapRef = useRef(null);
  const cesiumRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const cesiumViewerRef = useRef(null);
  const overlayRef = useRef(null);
  const [placedModels, setPlacedModels] = useState([]);
  const [selectedModelIndex, setSelectedModelIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // AI Insights State
  const [showInsights, setShowInsights] = useState(false);
  const [insightsData, setInsightsData] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const bounds = getQueryParams(location.search);

  const handleAnalyze = async () => {
    setShowInsights(true);
    setLoadingInsights(true);

    // Calculate center for analysis
    const centerLat = (bounds.n + bounds.s) / 2;
    const centerLng = (bounds.e + bounds.w) / 2;

    try {
      const res = await fetch('/api/planning/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: centerLat,
          lng: centerLng,
          items: placedModels.map(m => ({ label: m.label, coordinates: m.coordinates }))
        })
      });

      if (res.ok) {
        const data = await res.json();
        setInsightsData(data);
      } else {
        setInsightsData({ error: 'Failed to generate insights.' });
      }
    } catch (err) {
      console.error(err);
      setInsightsData({ error: 'Connection error.' });
    }
    setLoadingInsights(false);
  };

  const handleDownloadReport = async () => {
    if (!insightsData) return;
    generatePlanningPDF(insightsData, null);
  };

  // Initialize Cesium viewer
  useEffect(() => {
    const loadCesiumAndInit = async () => {
      if (!window.Cesium && cesiumRef.current && !cesiumViewerRef.current) {
        // Load Cesium CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cesium.com/downloads/cesiumjs/releases/1.111/Build/Cesium/Widgets/widgets.css';
        document.head.appendChild(link);

        // Load Cesium JS
        const script = document.createElement('script');
        script.src = 'https://cesium.com/downloads/cesiumjs/releases/1.111/Build/Cesium/Cesium.js';
        script.onload = async () => {
          await initializeCesium();
        };
        document.body.appendChild(script);
      } else if (window.Cesium && cesiumRef.current && !cesiumViewerRef.current) {
        await initializeCesium();
      }
    };

    const initializeCesium = async () => {
      if (!cesiumRef.current || cesiumViewerRef.current) return;

      const Cesium = window.Cesium;
      const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI5NzM0MzFmYy00YTM5LTQxNzQtYWUwYi02YmZiMWIxN2EwNjQiLCJpZCI6Mzc1MDY4LCJpYXQiOjE3Njc2MDUwNjN9.g01lWEw1_RP1A-xsLsON36YuxA6j1F745lEE80nV4HQ';

      const viewer = new Cesium.Viewer(cesiumRef.current, {
        timeline: false,
        animation: false,
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        fullscreenButton: false,
        infoBox: false,
        selectionIndicator: false,
        requestRenderMode: true,
        maximumRenderTimeChange: Infinity,
      });

      cesiumViewerRef.current = viewer;

      // Add Bing Maps imagery
      Cesium.IonImageryProvider.fromAssetId(2).then(imageryProvider => {
        viewer.imageryLayers.removeAll();
        viewer.imageryLayers.addImageryProvider(imageryProvider);
      }).catch(error => {
        console.error('Error loading Bing imagery:', error);
      });

      // Add world terrain
      viewer.terrainProvider = await Cesium.createWorldTerrainAsync();

      // Load Google Photorealistic 3D Tiles
      try {
        const tileset = await Cesium.Cesium3DTileset.fromUrl(
          `https://tile.googleapis.com/v1/3dtiles/root.json?key=${GOOGLE_API_KEY}`,
          {
            shadows: Cesium.ShadowMode.ENABLED,
            skipLevelOfDetail: true,
            baseScreenSpaceError: 1024,
            skipScreenSpaceErrorFactor: 16,
            skipLevels: 1,
            immediatelyLoadDesiredLevelOfDetail: false,
            loadSiblings: false,
            cullWithChildrenBounds: true,
            maximumScreenSpaceError: 16,
          }
        );
        viewer.scene.primitives.add(tileset);
      } catch (error) {
        console.error('Error loading Google 3D Tiles:', error);
      }

      // Draw selected region rectangle on Cesium
      const { n, s, e, w } = bounds;
      viewer.entities.add({
        rectangle: {
          coordinates: Cesium.Rectangle.fromDegrees(w, s, e, n),
          material: Cesium.Color.YELLOW.withAlpha(0.3),
          outline: false,
          outlineColor: Cesium.Color.YELLOW,
          outlineWidth: 3,
        },
      });

      // Fly to the selected region
      const centerLat = (n + s) / 2;
      const centerLng = (e + w) / 2;
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(centerLng, centerLat, 2000),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-89),
          roll: 0
        }
      });
    };

    loadCesiumAndInit();

    return () => {
      if (cesiumViewerRef.current) {
        cesiumViewerRef.current.destroy();
        cesiumViewerRef.current = null;
      }
    };
  }, []);

  // Initialize Google Maps
  useEffect(() => {
    if (!window.google || !mapRef.current || mapInstanceRef.current) return;
    const { n, s, e, w } = bounds;

    console.log('[PlanningMode] Initializing map with bounds:', bounds);

    // Create Google Map
    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: (n + s) / 2, lng: (e + w) / 2 },
      zoom: 18,
      mapId: "3e9ab3019d1723b1f60010f9",
      disableDefaultUI: true,
      gestureHandling: 'greedy',
    });

    mapInstanceRef.current = map;

    // Initialize deck.gl overlay for 3D models
    const overlay = new GoogleMapsOverlay({ layers: [] });
    overlay.setMap(map);
    overlayRef.current = overlay;

    // Draw the selected region as a rectangle
    const rectangle = new window.google.maps.Rectangle({
      strokeColor: '#FFD600',
      strokeOpacity: 0.8,
      strokeWeight: 3,
      fillColor: '#FFD600',
      fillOpacity: 0.2,
      map,
      bounds: new window.google.maps.LatLngBounds(
        { lat: s, lng: w },
        { lat: n, lng: e }
      ),
    });

    // Fit map to the selected bounds
    map.fitBounds(new window.google.maps.LatLngBounds(
      { lat: s, lng: w },
      { lat: n, lng: e }
    ));

    // Drag & drop logic for placing markers
    const mapDiv = mapRef.current;
    mapDiv.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });

    mapDiv.addEventListener('drop', (e) => {
      e.preventDefault();
      const assetFile = e.dataTransfer.getData('asset');
      const asset = ASSETS.find(a => a.file === assetFile);
      if (!asset) return;

      // Convert pixel position to lat/lng
      const rect = mapDiv.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Use Google Maps projection to convert pixel to lat/lng
      const projection = map.getProjection();
      const bounds = map.getBounds();
      const topRight = projection.fromLatLngToPoint(bounds.getNorthEast());
      const bottomLeft = projection.fromLatLngToPoint(bounds.getSouthWest());
      const scale = Math.pow(2, map.getZoom());

      const worldPoint = new window.google.maps.Point(
        x / scale + bottomLeft.x,
        y / scale + topRight.y
      );

      const latLng = projection.fromPointToLatLng(worldPoint);

      console.log('[PlanningMode] Placing 3D model:', asset.label, 'at', latLng.lat(), latLng.lng());

      // Add to placed models
      const newModel = {
        coordinates: [latLng.lng(), latLng.lat()],
        file: asset.file,
        label: asset.label,
        scale: asset.scale,
        icon: asset.icon,
        size: 64, // Default size
        id: Date.now(), // Unique ID for each model
      };

      setPlacedModels(prev => [...prev, newModel]);
    });


    // Handle map clicks for deselecting
    mapDiv.addEventListener('click', (e) => {
      if (e.target === mapDiv) {
        setSelectedModelIndex(null);
      }
    });

    // Handle dragging placed emojis
    let dragStartPos = null;
    let draggedModelIndex = null;

    const handleMouseDown = (e) => {
      // Check if clicking on an existing emoji via deck.gl picking
      if (selectedModelIndex !== null) {
        draggedModelIndex = selectedModelIndex;
        dragStartPos = { x: e.clientX, y: e.clientY };
        setIsDragging(true);
        e.preventDefault();
      }
    };

    const handleMouseMove = (e) => {
      if (isDragging && draggedModelIndex !== null && dragStartPos) {
        // Convert pixel position to lat/lng
        const rect = mapDiv.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const projection = map.getProjection();
        const bounds = map.getBounds();
        const topRight = projection.fromLatLngToPoint(bounds.getNorthEast());
        const bottomLeft = projection.fromLatLngToPoint(bounds.getSouthWest());
        const scale = Math.pow(2, map.getZoom());

        const worldPoint = new window.google.maps.Point(
          x / scale + bottomLeft.x,
          y / scale + topRight.y
        );

        const latLng = projection.fromPointToLatLng(worldPoint);

        // Update the model's position
        const updated = [...placedModels];
        updated[draggedModelIndex].coordinates = [latLng.lng(), latLng.lat()];
        setPlacedModels(updated);
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        dragStartPos = null;
        draggedModelIndex = null;
      }
    };

    mapDiv.addEventListener('mousedown', handleMouseDown);
    mapDiv.addEventListener('mousemove', handleMouseMove);
    mapDiv.addEventListener('mouseup', handleMouseUp);
    mapDiv.addEventListener('mouseleave', handleMouseUp);

    return () => {
      mapDiv.removeEventListener('mousedown', handleMouseDown);
      mapDiv.removeEventListener('mousemove', handleMouseMove);
      mapDiv.removeEventListener('mouseup', handleMouseUp);
      mapDiv.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [bounds, selectedModelIndex, isDragging, placedModels]);

  // Update deck.gl layer when models are placed
  useEffect(() => {
    if (!overlayRef.current) return;

    if (placedModels.length === 0) {
      overlayRef.current.setProps({ layers: [] });
      return;
    }

    console.log('[PlanningMode] Rendering', placedModels.length, 'models');

    // Group placedModels by file
    const modelsByFile = placedModels.reduce((acc, model) => {
      if (!acc[model.file]) acc[model.file] = [];
      acc[model.file].push(model);
      return acc;
    }, {});

    // Create IconLayer with emoji icons
    const iconMapping = {};
    const iconAtlas = document.createElement('canvas');
    const ctx = iconAtlas.getContext('2d');
    const iconSize = 256; // Increased size for better quality

    // Get unique icons
    const uniqueIcons = [...new Set(placedModels.map(m => m.icon))];
    iconAtlas.width = iconSize * uniqueIcons.length;
    iconAtlas.height = iconSize;

    uniqueIcons.forEach((icon, index) => {
      // Use a font that supports emojis better
      ctx.font = `${iconSize * 0.75}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Clear the area first
      ctx.clearRect(iconSize * index, 0, iconSize, iconSize);

      // Draw the emoji
      ctx.fillText(icon, iconSize * index + iconSize / 2, iconSize / 2);

      iconMapping[icon] = {
        x: iconSize * index,
        y: 0,
        width: iconSize,
        height: iconSize,
        anchorY: iconSize / 2,
        anchorX: iconSize / 2,
      };
    });

    const iconLayer = new IconLayer({
      id: 'icon-layer',
      data: placedModels,
      pickable: true,
      iconAtlas: iconAtlas.toDataURL(),
      iconMapping,
      getIcon: d => d.icon,
      getPosition: d => d.coordinates,
      getSize: d => d.size || 64,
      sizeScale: 1,
      onClick: (info) => {
        if (info.object) {
          const index = placedModels.findIndex(m => m.id === info.object.id);
          setSelectedModelIndex(index);
        }
      },
    });

    overlayRef.current.setProps({ layers: [iconLayer] });
    console.log('[PlanningMode] Layers updated with icon layer');
  }, [placedModels]);

  return (
    <div className="flex w-full h-screen overflow-hidden bg-white">
      {/* Sidebar - Fixed width, Flex Item */}
      <div className="w-32 bg-white/90 shadow-lg z-20 flex flex-col items-center pt-8 gap-6 flex-shrink-0 border-r border-gray-300">
        <h3 className="text-xs font-bold text-gray-800 mb-2">Assets</h3>
        {ASSETS.map(asset => (
          <div
            key={asset.file}
            draggable="true"
            onDragStart={e => e.dataTransfer.setData('asset', asset.file)}
            className="flex flex-col items-center cursor-grab hover:bg-cyan-100 rounded p-2 border border-gray-300 transition-colors"
            style={{ userSelect: 'none' }}
          >
            <div className="text-3xl mb-1">{asset.icon}</div>
            <span className="text-xs font-bold text-gray-700 text-center">{asset.label}</span>
          </div>
        ))}

        <div className="w-full h-[1px] bg-gray-300 my-2" />

        <button
          onClick={handleAnalyze}
          className="mx-2 mb-4 px-3 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-lg shadow-md transition-all flex flex-col items-center gap-1 group"
        >
          <div className="p-1.5 bg-white/20 rounded-full group-hover:scale-110 transition-transform">
            ✨
          </div>
          <span className="text-xs font-bold font-mono">AI INSIGHTS</span>
        </button>
      </div>

      {/* Maps Container - Flex Grow to take remaining space */}
      <div className="flex-1 flex relative h-full">
        {/* 2D Google Map - Left Side */}
        <div className="basis-1/2 h-full relative border-r-4 border-black">
          <div className="absolute top-4 left-4 bg-white/95 px-3 py-1.5 rounded shadow-lg z-10 border border-gray-200">
            <span className="text-sm font-bold text-gray-800">2D Map</span>
          </div>
          <div
            ref={mapRef}
            className="w-full h-full bg-gray-100"
            style={{ boxSizing: 'border-box' }}
          />
        </div>

        {/* 3D Cesium Map - Right Side */}
        <div className="basis-1/2 h-full relative border-l-4 border-black">
          <div className="absolute top-4 left-4 bg-white/95 px-3 py-1.5 rounded shadow-lg z-10 border border-gray-200">
            <span className="text-sm font-bold text-gray-800">3D Photorealistic Map</span>
          </div>
          <div
            ref={cesiumRef}
            className="w-full h-full bg-black"
            style={{ boxSizing: 'border-box' }}
          />
        </div>

        {/* Resize Controls - Appears when an emoji is selected */}
        {selectedModelIndex !== null && (
          <div className="absolute bottom-4 left-1/4 transform -translate-x-1/2 bg-white/95 px-4 py-3 rounded-lg shadow-xl z-20 border border-gray-300">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-gray-800 text-center mb-1">
                Selected: {placedModels[selectedModelIndex]?.label}
              </span>
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => {
                    const updated = [...placedModels];
                    updated[selectedModelIndex].size = Math.max(20, (updated[selectedModelIndex].size || 64) - 10);
                    setPlacedModels(updated);
                  }}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 font-bold"
                >
                  -
                </button>
                <span className="text-xs font-semibold text-gray-700 min-w-[60px] text-center">
                  Size: {placedModels[selectedModelIndex]?.size || 64}
                </span>
                <button
                  onClick={() => {
                    const updated = [...placedModels];
                    updated[selectedModelIndex].size = Math.min(200, (updated[selectedModelIndex].size || 64) + 10);
                    setPlacedModels(updated);
                  }}
                  className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 font-bold"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => {
                  const updated = placedModels.filter((_, i) => i !== selectedModelIndex);
                  setPlacedModels(updated);
                  setSelectedModelIndex(null);
                }}
                className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-800 text-xs font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* AI Insights Popup */}
      {showInsights && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animation-fade-in-up">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-4 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-lg animate-pulse">
                  🤖
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg tracking-wide">PLANNING INTELLIGENCE</h2>
                  <p className="text-cyan-400 text-xs font-mono">GEOCORTEX AI ENGINE</p>
                </div>
              </div>
              <button
                onClick={() => setShowInsights(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar bg-gray-50 flex-1">
              {loadingInsights ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                  <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-gray-500 font-mono animate-pulse">Calculating Environmental Impact...</p>
                </div>
              ) : insightsData?.error ? (
                <div className="text-red-500 text-center p-8 bg-red-50 rounded-lg border border-red-100">
                  <p className="font-bold">Analysis Failed</p>
                  <p className="text-sm">{insightsData.error}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                      <p className="text-xs text-gray-500 uppercase font-bold">Base Temp</p>
                      <p className="text-2xl font-bold text-gray-800">{insightsData?.base_temp}°C</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                      <p className="text-xs text-gray-500 uppercase font-bold">Projected</p>
                      <div className="flex items-baseline gap-1">
                        <p className="text-2xl font-bold text-blue-600">{insightsData?.projected_temp}°C</p>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                      <p className="text-xs text-gray-500 uppercase font-bold">Impact</p>
                      <p className={`text-2xl font-bold ${insightsData?.net_change < 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {insightsData?.net_change > 0 ? '+' : ''}{insightsData?.net_change}°C
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                      <p className="text-xs text-gray-500 uppercase font-bold">Assets</p>
                      <p className="text-2xl font-bold text-gray-800">{placedModels.length}</p>
                    </div>
                  </div>

                  {/* AI Analysis Text */}
                  <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <span>📝</span> AI CONSULTANT REPORT
                    </h3>
                    <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed font-sans text-sm">
                      {insightsData?.ai_report_text?.split('\n').map((line, i) => (
                        <p key={i} className={`min-h-[1em] ${line.includes('**') ? 'font-bold text-gray-800 mt-2' : ''}`}>
                          {line.replace(/\*\*/g, '')}
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* Downloads */}
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleDownloadReport}
                      className="flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg shadow hover:shadow-lg transition-all font-semibold"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download Official Report
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanningMode;
