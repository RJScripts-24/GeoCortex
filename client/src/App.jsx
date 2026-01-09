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
import CinematicPreview from './components/CinematicPreview';
import GestureInstructionsPopup from './components/GestureInstructionsPopup';
import LandingPage from './components/LandingPage';
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
  const [showCinematicPreview, setShowCinematicPreview] = React.useState(false);
  const [currentLocationName, setCurrentLocationName] = React.useState('');
  const [showDronePopup, setShowDronePopup] = React.useState(false);
  const [showGestureInstructions, setShowGestureInstructions] = React.useState(true);
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
        {/* Landing Page - Default Route */}
        <Route path="/" element={<LandingPage />} />

        {/* Map Interface */}
        <Route
          path="/map"
          element={
            <div className="relative w-full h-screen overflow-hidden bg-gray-50 flex">
              {/* Main Content Area */}
              <div className="flex-1 relative flex flex-col h-full">

                {/* Header Navbar */}
                <nav className="absolute top-0 left-0 w-full z-[100] bg-white/80 backdrop-blur-md border-b border-gray-200/50 flex items-center justify-between px-6 py-3 shadow-sm">
                  <div className="flex items-center gap-6">
                    {/* Brand */}
                    <div className="flex items-center gap-2">
                      <img
                        src="/Geocortex Logo.png"
                        alt="GeoCortex Logo"
                        className="h-10 w-auto object-contain"
                      />
                    </div>

                    {/* Mode Switcher Pill */}
                    <div className="flex bg-gray-100/80 p-1 rounded-full border border-gray-200 shadow-inner">
                      <button
                        onClick={() => setPlanningTrigger(false)}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${!planningTrigger ? 'bg-green-500 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        Viewing Mode
                      </button>
                      <button
                        onClick={() => setPlanningTrigger(true)}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${planningTrigger ? 'bg-white text-slate-800 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        Planning Mode
                      </button>
                    </div>

                    {/* Navbar Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (currentLocationName) {
                            setShowCinematicPreview(true);
                          } else {
                            setShowDronePopup(true);
                          }
                        }}
                        title={!currentLocationName ? "Search for a location first" : "View Cinematic Aerial Video"}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-md ${currentLocationName
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:scale-105 active:scale-95'
                          : 'bg-gray-200 text-gray-500 hover:bg-gray-300 cursor-pointer'
                          }`}
                      >
                        <svg className={`w-4 h-4 ${currentLocationName ? 'text-white' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        Drone View
                      </button>
                    </div>
                  </div>

                  {/* Search and Profile */}
                  <div className="flex items-center gap-4">
                    <SearchBox onSelectLocation={(loc) => {
                      setMoveTo({ lat: loc.lat, lng: loc.lon });
                      // Also update current location for cinematic view if needed
                      setCurrentLocationName(loc.display_name);
                    }} />
                  </div>
                </nav>

                {/* Map Area */}
                <div className="flex-1 w-full relative pt-[64px] bg-slate-100">
                  <div className="flex w-full h-full">
                    <div className="w-1/2 h-full relative border-r border-white/20">
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

                  {/* Floating Elements on top of Map */}
                  <GestureHUD />
                  <Controls />
                  <GestureCam />

                  {/* Cinematic Preview Overlay */}
                  {showCinematicPreview && (
                    <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-8 animate-in fade-in zoom-in duration-300">
                      <div className="w-full max-w-5xl shadow-2xl rounded-2xl overflow-hidden">
                        <CinematicPreview
                          targetAddress={currentLocationName}
                          onClose={() => setShowCinematicPreview(false)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Drone View Search Prompt Popup */}
                  {showDronePopup && (
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
                      onClick={() => setShowDronePopup(false)}
                    >
                      <div
                        style={{
                          background: 'white',
                          borderRadius: '12px',
                          padding: '24px',
                          maxWidth: '400px',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                          <span style={{ fontSize: '2rem', marginRight: '12px' }}>🔍</span>
                          <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#333' }}>
                            Search Location First
                          </h3>
                        </div>
                        <p style={{ fontSize: '1rem', lineHeight: '1.6', color: '#555', marginBottom: '20px' }}>
                          Please use the <strong style={{ color: '#06b6d4' }}>search bar</strong> to find a location before viewing the cinematic drone footage.
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
                          onClick={() => setShowDronePopup(false)}
                        >
                          Got it
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Absolute positioned Sidebar Panel (Hidden/Shown) */}
                  <Sidebar />

                  {/* Gesture Instructions Popup on Load */}
                  {showGestureInstructions && (
                    <GestureInstructionsPopup onClose={() => setShowGestureInstructions(false)} />
                  )}
                </div>
              </div>
            </div>
          }
        />
        <Route path="/planning" element={<PlanningMode />} />
      </Routes>
    </GlobalProvider>
  );
};

export default App;