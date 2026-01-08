import React, { useEffect, useRef, useState } from 'react';
import { useGlobalStore } from '../context/GlobalStore';
import { fetchHeatLayer } from '../services/api';
import html2canvas from 'html2canvas';
import EnergyModeCesium from './EnergyModeCesium.jsx';

// Minimum safe camera height to prevent 3D tileset crashes
const MIN_SAFE_HEIGHT = 800; // meters



const CesiumViewer = ({ mapView, onViewChange, planningTrigger, setPlanningTrigger }) => {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const isUpdatingRef = useRef(false);
  // Planning Mode selection state
  const [planningMode, setPlanningMode] = useState(false);
  const selectionRef = useRef({ active: false, start: null, end: null, rectEntity: null });
  const navigate = window.reactRouterNavigate || ((url) => { window.location.href = url; });
  // Zoom limit notification state
  const [showZoomLimitPopup, setShowZoomLimitPopup] = useState(false);

  // Helper function: Convert Google Maps zoom to Cesium height
  // Using empirical formula that matches Google Maps field of view
  const zoomToHeight = (zoom) => {
    // Clamp zoom to valid range
    const clampedZoom = Math.max(0, Math.min(21, zoom));
    // Empirical formula: provides accurate match with Google Maps
    let height = 591657550.5 / Math.pow(2, clampedZoom);
    // Clamp height to safe range (50m to 50M meters)
    height = Math.max(50, Math.min(50000000, height));
    return height;
  };

  // Helper function: Calculate optimal pitch based on height to avoid terrain collisions
  const calculatePitch = (height) => {
    // Use top-down view for better alignment with 2D map
    // At very low heights, use steeper angle to avoid collisions
    if (height < 300) {
      return -89.5; // Nearly straight down
    } else if (height < 1000) {
      return -89; // Top-down
    } else {
      return -89; // Keep top-down for consistent view alignment
    }
  };

  // Helper function: Convert Cesium height to Google Maps zoom
  const heightToZoom = (height) => {
    // Clamp height to safe range
    const clampedHeight = Math.max(50, Math.min(50000000, height));
    const zoom = Math.log2(591657550.5 / clampedHeight);
    // Clamp zoom to valid range
    return Math.max(0, Math.min(21, Math.round(zoom)));
  };

  // Listen for planningTrigger prop
  useEffect(() => {
    if (typeof planningTrigger !== 'undefined' && planningTrigger) {
      enableRegionSelection();
    }
    // eslint-disable-next-line
  }, [planningTrigger]);
  // Enable region selection for planning mode
  const enableRegionSelection = () => {
    if (!viewerRef.current || !window.Cesium || !containerRef.current) return;
    const Cesium = window.Cesium;
    const viewer = viewerRef.current;
    setPlanningMode(true);
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    let startCartographic = null;
    let rectEntity = null;
    handler.setInputAction((click) => {
      const cartesian = viewer.scene.camera.pickEllipsoid(click.position, viewer.scene.globe.ellipsoid);
      if (!cartesian) return;
      startCartographic = Cesium.Cartographic.fromCartesian(cartesian);
      selectionRef.current.active = true;
      selectionRef.current.start = startCartographic;
      // Draw initial rectangle entity
      if (rectEntity) viewer.entities.remove(rectEntity);
      rectEntity = viewer.entities.add({
        rectangle: {
          coordinates: Cesium.Rectangle.fromCartographicArray([startCartographic, startCartographic]),
          material: Cesium.Color.YELLOW.withAlpha(0.4),
          outline: true,
          outlineColor: Cesium.Color.YELLOW,
        },
      });
      selectionRef.current.rectEntity = rectEntity;
    }, Cesium.ScreenSpaceEventType.RIGHT_DOWN);

    handler.setInputAction((movement) => {
      if (!selectionRef.current.active || !startCartographic) return;
      const cartesian = viewer.scene.camera.pickEllipsoid(movement.endPosition, viewer.scene.globe.ellipsoid);
      if (!cartesian) return;
      const endCartographic = Cesium.Cartographic.fromCartesian(cartesian);
      selectionRef.current.end = endCartographic;
      // Update rectangle entity
      if (rectEntity) {
        rectEntity.rectangle.coordinates = Cesium.Rectangle.fromCartographicArray([startCartographic, endCartographic]);
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    handler.setInputAction((click) => {
      if (!selectionRef.current.active || !startCartographic) return;
      const cartesian = viewer.scene.camera.pickEllipsoid(click.position, viewer.scene.globe.ellipsoid);
      if (!cartesian) return;
      const endCartographic = Cesium.Cartographic.fromCartesian(cartesian);
      selectionRef.current.end = endCartographic;
      // Finalize rectangle
      const north = Math.max(startCartographic.latitude, endCartographic.latitude) * 180 / Math.PI;
      const south = Math.min(startCartographic.latitude, endCartographic.latitude) * 180 / Math.PI;
      const east = Math.max(startCartographic.longitude, endCartographic.longitude) * 180 / Math.PI;
      const west = Math.min(startCartographic.longitude, endCartographic.longitude) * 180 / Math.PI;
      // Remove rectangle entity
      if (rectEntity) viewer.entities.remove(rectEntity);
      handler.destroy();
      setPlanningMode(false);
      // Redirect to planning mode
      if (typeof setPlanningTrigger === 'function') setPlanningTrigger(false);
      navigate(`/planning?n=${north}&s=${south}&e=${east}&w=${west}`);
    }, Cesium.ScreenSpaceEventType.RIGHT_UP);
  };
  const [menuPos, setMenuPos] = useState(null);
  const [clickedLatLng, setClickedLatLng] = useState(null);
  const { activeLayer, year, setShowConsultant, setAnalysis, setIsAnalyzing, setClickedLocation, setMapImage } = useGlobalStore();
  const [heatLayer, setHeatLayer] = useState(null);
  const [heatTileUrl, setHeatTileUrl] = useState(null);
  const tilesetRef = useRef(null); // Store reference to Google 3D tileset
  // Fetch heatmap tile URL when year or activeLayer changes (for thermal view)
  useEffect(() => {
    if (activeLayer !== 'heat') {
      setHeatTileUrl(null);
      return;
    }
    fetchHeatLayer(year)
      .then((data) => {
        if (data.tileUrl) {
          setHeatTileUrl(data.tileUrl);
        } else {
          setHeatTileUrl(null);
        }
      })
      .catch(() => setHeatTileUrl(null));
  }, [year, activeLayer]);

  // Add or remove Cesium heatmap imagery layer when heatTileUrl changes
  useEffect(() => {
    if (!viewerRef.current || !window.Cesium) return;
    const Cesium = window.Cesium;
    const viewer = viewerRef.current;
    // Remove previous heat layer if any
    if (heatLayer) {
      try { viewer.imageryLayers.remove(heatLayer, false); } catch { }
      setHeatLayer(null);
    }
    if (activeLayer === 'heat' && heatTileUrl) {
      // Hide the 3D tileset when in thermal mode so heatmap is visible
      if (tilesetRef.current) {
        tilesetRef.current.show = false;
        console.log('✓ Hiding 3D tileset for thermal view');
      }
      const newLayer = new Cesium.UrlTemplateImageryProvider({
        url: heatTileUrl,
        maximumLevel: 19,
        tilingScheme: new Cesium.WebMercatorTilingScheme(),
        credit: 'MODIS LST',
      });
      // Add the heatmap imagery layer to the top of the stack for maximum visibility
      const imageryLayer = viewer.imageryLayers.addImageryProvider(newLayer);
      imageryLayer.alpha = 0.8; // Set to 0.8 to match 2D map
      // Move the heatmap layer to the top (above all others)
      viewer.imageryLayers.raiseToTop(imageryLayer);
      setHeatLayer(imageryLayer);
      console.log('✓ Heatmap layer added');
    } else {
      // Show the 3D tileset when not in thermal mode
      if (tilesetRef.current) {
        tilesetRef.current.show = true;
        console.log('✓ Showing 3D tileset for satellite view');
      }
    }
    // eslint-disable-next-line
  }, [heatTileUrl, activeLayer]);

  // Hide menu on click elsewhere
  useEffect(() => {
    const hideMenu = () => setMenuPos(null);
    window.addEventListener('click', hideMenu);
    return () => window.removeEventListener('click', hideMenu);
  }, []);

  // Handle Analyze Now click (full logic)
  const handleAnalyzeNow = async () => {
    setShowConsultant(true);
    setMenuPos(null);
    let lat = clickedLatLng?.lat;
    let lng = clickedLatLng?.lng;
    if (!lat || !lng) {
      lat = 12.9716;
      lng = 77.5946;
    }
    setClickedLocation({ lat, lng });

    // Screenshot of Cesium canvas
    try {
      if (containerRef.current) {
        // Find Cesium canvas inside container
        const canvas = containerRef.current.querySelector('canvas');
        if (canvas) {
          // Use toDataURL directly for Cesium canvas
          const imageData = canvas.toDataURL('image/png');
          setMapImage(imageData);
        }
      }
    } catch (err) {
      console.error('Failed to capture Cesium view:', err);
    }

    // Only allow heat analysis in Thermal X-Ray mode
    if (activeLayer !== 'heat') {
      // Fetch location name even in non-thermal mode
      setIsAnalyzing(true);
      try {
        const analysisRes = await fetch('/api/analyze', {
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

  useEffect(() => {
    // Load Cesium dynamically
    const loadCesiumAndInit = async () => {
      if (!window.Cesium) {
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
      } else {
        await initializeCesium();
      }
    };

    loadCesiumAndInit();

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
      }
    };
  }, []);

  // Update Cesium camera when mapView changes (from external source or 2D map)
  useEffect(() => {
    if (!viewerRef.current || !window.Cesium || !mapView) return;

    const Cesium = window.Cesium;
    const viewer = viewerRef.current;

    // Validate mapView values
    if (!mapView.lat || !mapView.lng || mapView.zoom === undefined) return;
    if (Math.abs(mapView.lat) > 90 || Math.abs(mapView.lng) > 180) return;

    isUpdatingRef.current = true;
    let height = zoomToHeight(mapView.zoom);
    let pitch = calculatePitch(height);

    // Check if height is below minimum safe threshold
    if (height < MIN_SAFE_HEIGHT) {
      console.warn('[Cesium Sync] Camera height', height.toFixed(2), 'm is below minimum safe height', MIN_SAFE_HEIGHT, 'm. Sync prevented to avoid crash.');
      setShowZoomLimitPopup(true);
      isUpdatingRef.current = false;
      return; // Prevent camera update
    }

    // At very low heights, force top-down and add small offset for safety
    if (height < 1000) {
      pitch = -89;
      height = height + 20; // small safety offset
    }
    console.log('[Cesium Sync] Setting camera height:', height, 'pitch:', pitch, 'for zoom:', mapView.zoom);

    try {
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(
          mapView.lng,
          mapView.lat,
          height
        ),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(pitch),
          roll: 0
        }
      });
    } catch (error) {
      console.error('[Cesium Sync] Error setting Cesium camera at height:', height, 'zoom:', mapView.zoom, error);
    }

    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 150);
  }, [mapView]);

  // ONE-WAY SYNC: Disabled 3D → 2D sync (only 2D → 3D is active)
  // The 3D map will follow the 2D map, but not vice versa
  // useEffect(() => {
  //   if (!viewerRef.current || !onViewChange || !window.Cesium) return;
  //   
  //   const Cesium = window.Cesium;
  //   const viewer = viewerRef.current;
  //   let debounceTimeout = null;
  //   
  //   const reportView = () => {
  //     if (isUpdatingRef.current) return;
  //     
  //     clearTimeout(debounceTimeout);
  //     debounceTimeout = setTimeout(() => {
  //       try {
  //         const position = viewer.camera.positionCartographic;
  //         if (!position) return;
  //         
  //         const lat = Cesium.Math.toDegrees(position.latitude);
  //         const lng = Cesium.Math.toDegrees(position.longitude);
  //         const height = position.height;
  //         
  //         // Validate values before reporting
  //         if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return;
  //         if (height < 100 || height > 50000000) return;
  //         
  //         const zoom = heightToZoom(height);
  //         
  //         onViewChange({ lat, lng, zoom });
  //       } catch (error) {
  //         console.error('Error reporting Cesium view:', error);
  //       }
  //     }, 300);
  //   };
  //   
  //   viewer.camera.moveEnd.addEventListener(reportView);
  //   return () => {
  //     clearTimeout(debounceTimeout);
  //     viewer.camera.moveEnd.removeEventListener(reportView);
  //   };
  // }, [onViewChange]);


  const initializeCesium = async () => {
    if (!containerRef.current || viewerRef.current) return;

    const Cesium = window.Cesium;
    const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    // Set Cesium Ion access token
    Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI5NzM0MzFmYy00YTM5LTQxNzQtYWUwYi02YmZiMWIxN2EwNjQiLCJpZCI6Mzc1MDY4LCJpYXQiOjE3Njc2MDUwNjN9.g01lWEw1_RP1A-xsLsON36YuxA6j1F745lEE80nV4HQ';

    // Initialize Cesium Viewer
    const viewer = new Cesium.Viewer(containerRef.current, {
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
      // Use default imagery/terrain
    });

    viewerRef.current = viewer;

    // Attach context menu handler to canvas
    const canvas = containerRef.current.querySelector('canvas');
    if (canvas) {
      const handleCesiumContextMenu = (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cartesian = viewer.scene.camera.pickEllipsoid(
          new Cesium.Cartesian2(x, y),
          viewer.scene.globe.ellipsoid
        );
        if (cartesian) {
          const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
          const lat = Cesium.Math.toDegrees(cartographic.latitude);
          const lng = Cesium.Math.toDegrees(cartographic.longitude);
          setClickedLatLng({ lat, lng });
          setMenuPos({ x: e.clientX, y: e.clientY });
        }
      };
      canvas.addEventListener('contextmenu', handleCesiumContextMenu);
    }

    // Show globe and sky atmosphere
    if (viewer.scene && viewer.scene.globe) {
      viewer.scene.globe.show = true;
      viewer.scene.skyAtmosphere.show = true;
      viewer.scene.backgroundColor = Cesium.Color.BLACK;

      // Disable globe lighting initially to see imagery
      viewer.scene.globe.enableLighting = false;
    }

    // Add Bing Maps Aerial satellite imagery asynchronously
    Cesium.IonImageryProvider.fromAssetId(2).then(imageryProvider => {
      viewer.imageryLayers.removeAll();
      viewer.imageryLayers.addImageryProvider(imageryProvider);
      console.log('✓ Bing Maps Aerial satellite imagery loaded');
    }).catch(error => {
      console.error('Error loading Bing imagery:', error);
    });

    // Add world terrain for better 3D visualization
    viewer.terrainProvider = await Cesium.createWorldTerrainAsync();

    // Load Google Photorealistic 3D Tiles
    loadGoogleTiles(viewer, GOOGLE_API_KEY, Cesium);

    // Fly to Bangalore
    flyToBangalore(viewer, Cesium);
  };

  const loadGoogleTiles = async (viewer, apiKey, Cesium) => {
    try {
      const tileset = await Cesium.Cesium3DTileset.fromUrl(
        `https://tile.googleapis.com/v1/3dtiles/root.json?key=${apiKey}`,
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
          dynamicScreenSpaceError: true,
          dynamicScreenSpaceErrorDensity: 0.00278,
          dynamicScreenSpaceErrorFactor: 4.0,
          dynamicScreenSpaceErrorHeightFalloff: 0.25
        }
      );

      viewer.scene.primitives.add(tileset);
      tilesetRef.current = tileset; // Store reference for later control
      console.log('✓ Google Photorealistic 3D Tiles loaded successfully');

    } catch (error) {
      console.error('❌ Error loading Google 3D Tiles:', error);
      alert('Failed to load Google 3D Tiles. Check console for details.');
    }
  };

  const flyToBangalore = (viewer, Cesium) => {
    // Will be set by mapView prop, so just set a default safe view
    let height = zoomToHeight(mapView.zoom);
    let pitch = calculatePitch(height);
    if (height < 1000) {
      pitch = -89;
      height = height + 20;
    }
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(mapView.lng, mapView.lat, height),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(pitch),
        roll: 0
      }
    });
    console.log('✓ Camera positioned at:', mapView.lat, mapView.lng, 'height:', height.toFixed(0), 'm', 'pitch:', pitch);
  };

  return (
    <div className="relative w-full h-full">
      <div
        ref={containerRef}
        className="w-full h-full border-8 border-black rounded-xl box-border"
        style={{ boxSizing: 'border-box', marginTop: '0px' }}
      />
      {/* Energy Mode Rectangle & Context Menu */}
      <EnergyModeCesium viewer={viewerRef.current} />
      {/* Custom context menu */}
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
      {/* Zoom Limit Popup */}
      {showZoomLimitPopup && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
          }}
          onClick={() => setShowZoomLimitPopup(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '500px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '2rem', marginRight: '12px' }}>⚠️</span>
              <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#333' }}>
                Zoom Limit Reached
              </h3>
            </div>
            <p style={{ fontSize: '1rem', lineHeight: '1.6', color: '#555', marginBottom: '20px' }}>
              The 3D Photorealistic Map cannot synchronize at this zoom level due to technical limitations.
              For further zooming, please <strong>zoom directly in the Photorealistic 3D Map</strong> using your mouse wheel or pinch gestures.
            </p>
            <button
              style={{
                width: '100%',
                padding: '12px',
                background: '#06b6d4',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
              onClick={() => setShowZoomLimitPopup(false)}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CesiumViewer;
