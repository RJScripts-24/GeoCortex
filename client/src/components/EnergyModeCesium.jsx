// EnergyModeCesium.jsx
// Handles rectangle drawing, context menu, and solar analysis for Energy Mode
import { useEffect, useRef, useState } from 'react';
import { useGlobalStore } from '../context/GlobalStore';
import { API_BASE_URL } from '../config/api.js';

export default function EnergyModeCesium({ viewer }) {
  const { isEnergyMode, setShowConsultant, setAnalysis, setIsAnalyzing } = useGlobalStore();
  const [rectangleEntity, setRectangleEntity] = useState(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });
  const [rectangleData, setRectangleData] = useState(null);
  const handlerRef = useRef(null);
  const drawingRef = useRef(false);
  const startCartographicRef = useRef(null);

  useEffect(() => {
    if (!viewer || !window.Cesium) return;
    const Cesium = window.Cesium;
    let handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handlerRef.current = handler;
    let rectangleEntityLocal = null;

    // Disable default context menu when in energy mode
    const handleContextMenu = (e) => {
      if (isEnergyMode) {
        e.preventDefault();
        return false;
      }
    };
    viewer.scene.canvas.addEventListener('contextmenu', handleContextMenu);

    // Disable Cesium right mouse camera controls in energy mode
    const controller = viewer.scene.screenSpaceCameraController;
    if (isEnergyMode) {
      controller.enableRotate = false;
      controller.enableLook = false;
      controller.enableTilt = false;
      controller.enableTranslate = false;
      controller.enableZoom = false;
    } else {
      controller.enableRotate = true;
      controller.enableLook = true;
      controller.enableTilt = true;
      controller.enableTranslate = true;
      controller.enableZoom = true;
    }

    function setCursor(cursor) {
      viewer.container.style.cursor = cursor;
    }
    function clearRectangle() {
      if (rectangleEntityLocal) {
        viewer.entities.remove(rectangleEntityLocal);
        rectangleEntityLocal = null;
      }
      setRectangleEntity(null);
      setRectangleData(null);
    }
    // --- Right mouse drag for rectangle selection ---
    function onRightDown(e) {
      if (!isEnergyMode) return;
      drawingRef.current = true;
      const pos = e.position;
      const cartesian = viewer.camera.pickEllipsoid(pos, viewer.scene.globe.ellipsoid);
      if (!cartesian) return;
      startCartographicRef.current = Cesium.Cartographic.fromCartesian(cartesian);
      clearRectangle();
      setContextMenu({ visible: false, x: 0, y: 0 }); // Hide any existing menu
    }
    function onMouseMove(e) {
      if (!drawingRef.current || !isEnergyMode) return;
      const pos = e.endPosition;
      const cartesian = viewer.camera.pickEllipsoid(pos, viewer.scene.globe.ellipsoid);
      if (!cartesian) return;
      const endCartographic = Cesium.Cartographic.fromCartesian(cartesian);
      const west = Math.min(startCartographicRef.current.longitude, endCartographic.longitude);
      const east = Math.max(startCartographicRef.current.longitude, endCartographic.longitude);
      const south = Math.min(startCartographicRef.current.latitude, endCartographic.latitude);
      const north = Math.max(startCartographicRef.current.latitude, endCartographic.latitude);
      const rectangle = Cesium.Rectangle.fromRadians(west, south, east, north);
      if (rectangleEntityLocal) viewer.entities.remove(rectangleEntityLocal);
      rectangleEntityLocal = viewer.entities.add({
        rectangle: {
          coordinates: rectangle,
          material: Cesium.Color.fromCssColorString('#FFD600').withAlpha(0.95), // Solid dark yellow
          outline: true,
          outlineColor: Cesium.Color.ORANGE,
          zIndex: 9999, // Bring to front if supported
          classificationType: Cesium.ClassificationType.BOTH,
          height: 0,
          show: true,
          // Disable depth test to always show on top
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
      });
      setRectangleEntity(rectangleEntityLocal);
      setRectangleData({ rectangle, center: Cesium.Rectangle.center(rectangle) });
    }
    function onRightUp(e) {
      if (!isEnergyMode) return;
      if (!drawingRef.current) return; // Only if we were drawing
      drawingRef.current = false;
      // Show context menu at mouse position after selection if rectangle exists
      if (rectangleEntityLocal) {
        setContextMenu({ visible: true, x: e.position.x, y: e.position.y });
      }
    }
    if (isEnergyMode) {
      setCursor('crosshair');
      handler.setInputAction(onRightDown, Cesium.ScreenSpaceEventType.RIGHT_DOWN);
      handler.setInputAction(onMouseMove, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
      handler.setInputAction(onRightUp, Cesium.ScreenSpaceEventType.RIGHT_UP);
    } else {
      setCursor('default');
      handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_DOWN);
      handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
      handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_UP);
      clearRectangle();
    }
    return () => {
      try {
        handler.destroy();
      } catch (e) {
        // Handler may already be destroyed
      }
      clearRectangle();
      // Guard against viewer being destroyed before cleanup
      try {
        if (viewer && !viewer.isDestroyed() && viewer.scene && viewer.scene.canvas) {
          viewer.scene.canvas.removeEventListener('contextmenu', handleContextMenu);
        }
        // Restore camera controls on cleanup (with null checks)
        if (viewer && !viewer.isDestroyed() && viewer.scene && viewer.scene.screenSpaceCameraController) {
          const controller = viewer.scene.screenSpaceCameraController;
          controller.enableRotate = true;
          controller.enableLook = true;
          controller.enableTilt = true;
          controller.enableTranslate = true;
          controller.enableZoom = true;
        }
      } catch (e) {
        // Viewer may already be destroyed, ignore cleanup errors
      }
    };
  }, [isEnergyMode, viewer]);

  async function handleAnalyzeSolar() {
    console.log('[DEBUG] Analyze Solar Potential clicked');
    setContextMenu({ ...contextMenu, visible: false });
    if (!rectangleData) {
      console.warn('[DEBUG] No rectangleData available');
      return;
    }
    const Cesium = window.Cesium;
    const centerCartographic = rectangleData.center;
    const center = {
      longitude: Cesium.Math.toDegrees(centerCartographic.longitude),
      latitude: Cesium.Math.toDegrees(centerCartographic.latitude)
    };
    const rect = rectangleData.rectangle;
    const bounds = {
      north: Cesium.Math.toDegrees(rect.north),
      south: Cesium.Math.toDegrees(rect.south),
      east: Cesium.Math.toDegrees(rect.east),
      west: Cesium.Math.toDegrees(rect.west)
    };
    console.log('[DEBUG] Rectangle center:', center);
    console.log('[DEBUG] Rectangle bounds:', bounds);
    setShowConsultant(true);
    setIsAnalyzing(true);
    try {
      console.log('[DEBUG] Sending POST to /api/analyze_solar', {
        lat: center.latitude,
        lng: center.longitude,
        bounds: bounds
      });
      const response = await fetch(`${API_BASE_URL}/api/analyze_solar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: center.latitude,
          lng: center.longitude,
          bounds: bounds
        })
      });
      console.log('[DEBUG] Response status:', response.status);
      if (!response.ok) {
        throw new Error('Failed to fetch solar analysis');
      }
      const data = await response.json();
      console.log('[DEBUG] Response data:', data);
      if (data.building_polygon?.vertices) {
        const positions = data.building_polygon.vertices.map(v =>
          Cesium.Cartesian3.fromDegrees(v.longitude, v.latitude, v.height || 0)
        );
        viewer.entities.add({
          polyline: {
            positions: [...positions, positions[0]],
            width: 4,
            material: Cesium.Color.LIME,
            clampToGround: true
          }
        });
      }
      setAnalysis(data.analysis);
      setIsAnalyzing(false);
    } catch (error) {
      console.error('[DEBUG] Solar analysis error:', error);
      setAnalysis(`<div style="color:#ff6e08;">Failed to fetch solar analysis. Please try again.</div>`);
      setIsAnalyzing(false);
    }
  }

  return (
    <>
      {contextMenu.visible && (
        <div
          style={{
            position: 'absolute',
            top: contextMenu.y,
            left: contextMenu.x,
            background: '#fff',
            border: '1px solid #ccc',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            zIndex: 1000,
            padding: '0'
          }}
        >
          <button
            onClick={handleAnalyzeSolar}
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              padding: '10px 16px',
              textAlign: 'left',
              cursor: 'pointer',
              fontWeight: 'bold',
              color: '#ff8b13',
              fontSize: '14px'
            }}
          >
            ☀️ Analyze Solar Potential
          </button>
        </div>
      )}
    </>
  );
}
