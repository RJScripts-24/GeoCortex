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
            <div className="relative w-full h-screen overflow-hidden bg-gray-50 flex">
              {/* Left Vertical Icon Sidebar */}
              <aside className="w-16 h-full bg-white border-r border-gray-200 flex flex-col items-center py-4 z-[110] shadow-sm">
                {/* Top Icon */}
                <div className="mb-8">
                  <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-cyan-50/50 text-cyan-600 hover:bg-cyan-100 transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2zm0 3.5L18.5 20H5.5L12 5.5z" /></svg>
                    {/* Placeholder generic icon */}
                  </button>
                </div>

                {/* Nav Icons */}
                <div className="flex flex-col gap-6 w-full items-center">
                  {['home', 'time', 'layers', 'user'].map((icon, idx) => (
                    <button key={icon} className={`group relative w-10 h-10 flex items-center justify-center rounded-full transition-all ${idx === 0 ? 'bg-gray-100 text-slate-800 shadow-inner' : 'text-gray-400 hover:text-slate-600 hover:bg-gray-50'}`}>
                      <div className="w-5 h-5 bg-current rounded-sm opacity-80" />
                      {/* Use simple shapes for now if no icons available, or SVGs */}
                    </button>
                  ))}
                </div>

                {/* Bottom Icons */}
                <div className="mt-auto flex flex-col gap-4">
                  <button className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-slate-600">
                    <div className="w-5 h-5 rounded-full border-2 border-current" />
                  </button>
                </div>
              </aside>

              {/* Main Content Area */}
              <div className="flex-1 relative flex flex-col h-full">

                {/* Header Navbar */}
                <nav className="absolute top-0 left-0 w-full z-[100] bg-white/80 backdrop-blur-md border-b border-gray-200/50 flex items-center justify-between px-6 py-3 shadow-sm">
                  <div className="flex items-center gap-6">
                    {/* Brand */}
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg shadow-lg flex items-center justify-center">
                        <span className="text-white font-bold text-xs">GC</span>
                      </div>
                      <h1 className="text-xl font-bold tracking-tight text-slate-800">
                        Geo<span className="text-slate-500 font-medium">Cortex</span>
                      </h1>
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
                  </div>

                  {/* Search and Profile */}
                  <div className="flex items-center gap-4">
                    <SearchBox onSelectLocation={(loc) => setMoveTo({ lat: loc.lat, lng: loc.lon })} />
                    <button className="w-8 h-8 rounded-full bg-yellow-400/20 text-yellow-600 flex items-center justify-center hover:bg-yellow-400/30 transition-colors">
                      <span className="font-bold text-xs">JD</span>
                    </button>
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

                  {/* Absolute positioned Sidebar Panel (Hidden/Shown) */}
                  <Sidebar />
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