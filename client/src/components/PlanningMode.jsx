import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { GoogleMapsOverlay } from '@deck.gl/google-maps';
import { ScenegraphLayer } from '@deck.gl/mesh-layers';

const ASSETS = [
  { label: 'Plant', file: 'Plant.glb', icon: '🌱', scale: 10 },
  { label: 'Building', file: 'Large%20Building.glb', icon: '🏢', scale: 1 },
  { label: 'Pond', file: 'Pond.glb', icon: '💧', scale: 5 },
  { label: 'RoadBlock', file: 'Road.glb', icon: '🚧', scale: 3 },
  { label: 'Tree', file: 'Tree.glb', icon: '🌳', scale: 10 },
  // Test asset with public .glb
  { label: 'TestModel', file: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMan/glTF-Binary/CesiumMan.glb', icon: '🧍', scale: 10 },
];

function getQueryParams(search) {
  const params = new URLSearchParams(search);
  return {
    n: parseFloat(params.get('n')),
    s: parseFloat(params.get('s')),
    e: parseFloat(params.get('e')),
    w: parseFloat(params.get('w')),
  };
}

const PlanningMode = () => {
  const location = useLocation();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const overlayRef = useRef(null);
  const [placedModels, setPlacedModels] = useState([]);
  const bounds = getQueryParams(location.search);

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

      // Log coordinates and map bounds
      console.log('[PlanningMode] Placing 3D model:', asset.label, 'at', latLng.lat(), latLng.lng());
      const mapBounds = map.getBounds();
      if (mapBounds) {
        const ne = mapBounds.getNorthEast();
        const sw = mapBounds.getSouthWest();
        console.log('[PlanningMode] Map bounds:', {
          north: ne.lat(), east: ne.lng(), south: sw.lat(), west: sw.lng()
        });
      }

      // Add to placed models
      const newModel = {
        coordinates: [latLng.lng(), latLng.lat()],
        file: asset.file,
        label: asset.label,
        scale: asset.scale,
      };
      
      setPlacedModels(prev => [...prev, newModel]);
    });
  }, [bounds]);

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

    // Create a ScenegraphLayer for each unique model file
    const layers = Object.entries(modelsByFile).map(([file, models]) => {
      // Use direct URL for public test model, otherwise use /file
      const isUrl = file.startsWith('http');
      const scenegraphPath = isUrl ? file : `/${file}`;
      const layer = new ScenegraphLayer({
        id: `scenegraph-layer-${file}`,
        data: models,
        pickable: true,
        scenegraph: scenegraphPath,
        getPosition: d => d.coordinates,
        getOrientation: d => [0, 0, 0],
        getTranslation: d => [0, 0, 10], // lift model 10 meters above ground
        sizeScale: d => (d.scale ? d.scale * 5 : 50), // increase scale for visibility
        _lighting: 'pbr',
        onLoad: (scenegraph) => {
          if (scenegraph) {
            console.log(`[PlanningMode] Model loaded for ${file}:`, scenegraph);
          } else {
            console.error(`[PlanningMode] Model failed to load for ${file}`);
          }
        },
      });
      console.log('[PlanningMode] Loading model:', scenegraphPath, 'with', models.length, 'instances');
      return layer;
    });

    overlayRef.current.setProps({ layers });
    console.log('[PlanningMode] Layers updated with', layers.length, 'unique models');
  }, [placedModels]);

  return (
    <div className="relative w-full h-full">
      {/* Sidebar */}
      <div className="absolute top-0 left-0 h-full w-32 bg-white/90 shadow-lg z-20 flex flex-col items-center pt-8 gap-6">
        <h3 className="text-xs font-bold text-gray-800 mb-2">Assets</h3>
        {ASSETS.map(asset => (
          <div
            key={asset.file}
            draggable="true"
            onDragStart={e => e.dataTransfer.setData('asset', asset.file)}
            className="flex flex-col items-center cursor-grab hover:bg-cyan-100 rounded p-2 border border-gray-300"
            style={{ userSelect: 'none' }}
          >
            <div className="text-3xl mb-1">{asset.icon}</div>
            <span className="text-xs font-bold text-gray-700 text-center">{asset.label}</span>
          </div>
        ))}
      </div>
      {/* Google Map */}
      <div
        ref={mapRef}
        className="w-full h-full border-8 border-black rounded-xl box-border"
        style={{ marginLeft: 128, boxSizing: 'border-box', marginTop: '0px' }}
      />
    </div>
  );
};

export default PlanningMode;
