import React from 'react';
import { GlobalProvider } from './context/GlobalStore';
import MapViewer from './components/MapViewer';
import CesiumViewer from './components/CesiumViewer';
import SearchBox from './components/SearchBox';
import Sidebar from './components/Sidebar';
import GestureCam from './components/GestureCam';
import GestureHUD from './components/GestureHUD';
import Controls from './components/Controls';
import PlanningMode from './components/PlanningMode';
import { Routes, Route } from 'react-router-dom';
import './App.css';

const App = () => {
  // Shared initial position for both maps
  const INITIAL_LAT = 12.9716;
  const INITIAL_LNG = 77.5946;
  const INITIAL_ZOOM = 10;

  const [mapView, setMapView] = React.useState({
    lat: INITIAL_LAT,
    lng: INITIAL_LNG,
    zoom: INITIAL_ZOOM
  });
  const [planningTrigger, setPlanningTrigger] = React.useState(false);
  const syncInProgressRef = React.useRef(false);
  
  // Handle view changes from either map
  const handleViewChange = (view) => {
    if (syncInProgressRef.current) return;
    syncInProgressRef.current = true;
    setMapView(view);
    setTimeout(() => {
      syncInProgressRef.current = false;
    }, 500);
  };
  
  // For search box
  const setMoveTo = ({ lat, lng }) => {
    syncInProgressRef.current = true;
    setMapView({ lat, lng, zoom: 14 });
    setTimeout(() => {
      syncInProgressRef.current = false;
    }, 500);
  };

  return (
    <GlobalProvider>
      <Routes>
        <Route
          path="/"
          element={
            <div className="relative w-full h-screen overflow-hidden bg-black">
              {/* Fixed translucent navbar */}
              <nav className="fixed top-0 left-0 w-full z-[100] bg-black/60 backdrop-blur-md border-b-2 border-black flex items-center justify-between px-8 py-3">
                <div className="flex items-center gap-4">
                  <h1 className="text-3xl font-black tracking-tighter text-white drop-shadow-lg select-none">
                    GEO<span className="text-cyan-400">CORTEX</span>
                  </h1>
                  <div className="flex items-center gap-2 ml-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <p className="text-[10px] font-mono text-green-400 tracking-widest uppercase select-none">
                      System Online
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setPlanningTrigger(true)}
                    className="px-4 py-2 bg-yellow-400/80 hover:bg-yellow-500 text-black font-bold rounded shadow text-xs transition-all"
                    disabled={planningTrigger}
                  >
                    {planningTrigger ? 'Select Region...' : 'Planning Mode'}
                  </button>
                  <SearchBox onSelectLocation={(loc) => setMoveTo({ lat: loc.lat, lng: loc.lon })} />
                </div>
              </nav>
              {/* Side-by-side 2D and 3D maps, with margin for navbar */}
              <div className="flex w-full h-full pt-[64px]">
                <div className="w-1/2 h-full relative">
                  <MapViewer
                    mapView={mapView}
                    onViewChange={handleViewChange}
                    planningTrigger={planningTrigger}
                    setPlanningTrigger={setPlanningTrigger}
                  />
                </div>
                <div className="w-1/2 h-full relative">
                  <CesiumViewer
                    mapView={mapView}
                    onViewChange={handleViewChange}
                    planningTrigger={planningTrigger}
                    setPlanningTrigger={setPlanningTrigger}
                  />
                </div>
              </div>
              <GestureHUD />
              <Controls />
              <GestureCam />
              {/* Sidebar (AI Consultant) below navbar */}
              <Sidebar />
            </div>
          }
        />
        <Route path="/planning" element={<PlanningMode />} />
      </Routes>
    </GlobalProvider>
  );
};

export default App;