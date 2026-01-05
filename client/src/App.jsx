import React from 'react';
import { GlobalProvider } from './context/GlobalStore';
import MapViewer from './components/MapViewer';
import SearchBox from './components/SearchBox';
import Sidebar from './components/Sidebar';
import GestureCam from './components/GestureCam';
import GestureHUD from './components/GestureHUD';
import Controls from './components/Controls';
import './App.css';

const App = () => {
  const [moveTo, setMoveTo] = React.useState(null);
  return (
    <GlobalProvider>
      <div className="relative w-full h-screen overflow-hidden bg-black">
        <MapViewer moveTo={moveTo} />
        <GestureHUD />
        <Controls />
        <GestureCam />
        {/* Fixed translucent navbar */}
        <nav className="fixed top-0 left-0 w-full z-[100] bg-black/60 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-8 py-3">
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
          <div className="flex items-center">
            <SearchBox onSelectLocation={(loc) => setMoveTo({ lat: loc.lat, lng: loc.lon })} />
          </div>
        </nav>
        {/* Sidebar (AI Consultant) below navbar */}
        <Sidebar />
      </div>
    </GlobalProvider>
  );
};

export default App;