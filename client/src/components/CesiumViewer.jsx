
import React, { useEffect, useRef, useState } from 'react';
import { useGlobalStore } from '../context/GlobalStore';
import { fetchHeatLayer } from '../services/api';
import html2canvas from 'html2canvas';
import EnergyModeCesium from './EnergyModeCesium.jsx';



const CesiumViewer = ({ moveTo }) => {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
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
        try { viewer.imageryLayers.remove(heatLayer, false); } catch {}
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

  // Fly to searched location if moveTo changes
  useEffect(() => {
    if (!viewerRef.current || !window.Cesium || !moveTo || !moveTo.lat || !moveTo.lng) return;
    const Cesium = window.Cesium;
    viewerRef.current.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        parseFloat(moveTo.lng),
        parseFloat(moveTo.lat),
        1500
      ),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-45),
        roll: 0
      },
      duration: 2
    });
  }, [moveTo]);


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
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(77.5946, 12.9716, 1500),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-45),
        roll: 0
      },
      duration: 3,
      complete: () => console.log('✓ Camera positioned over Bangalore')
    });
  };

  return (
    <div className="relative w-full h-screen">
      <div ref={containerRef} className="w-full h-full" />
      {/* Energy Mode Rectangle & Context Menu */}
      <EnergyModeCesium viewer={viewerRef.current} />
      {/* Info Panel */}
      <div className="absolute top-4 left-4 bg-black/80 text-white p-4 rounded-lg max-w-xs z-10">
        <h2 className="text-lg font-bold text-green-400 mb-2">🌍 Bangalore Digital Twin</h2>
        <p className="text-sm mb-1"><strong>Photorealistic 3D Tiles</strong></p>
        <p className="text-xs mb-1">Location: 12.9716°N, 77.5946°E</p>
        <p className="text-xs mb-1">Real-world lighting enabled</p>
        <p className="text-xs">Use mouse to navigate</p>
      </div>
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
    </div>
  );
};

export default CesiumViewer;
