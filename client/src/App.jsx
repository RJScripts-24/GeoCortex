import React from 'react';
import { GlobalProvider } from './context/GlobalStore';
import MapViewer from './components/MapViewer';
import Sidebar from './components/Sidebar';
import GestureCam from './components/GestureCam';
import GestureHUD from './components/GestureHUD';
import Controls from './components/Controls';
import './App.css';

const App = () => {
  return (
    <GlobalProvider>
      <div className="relative w-full h-screen overflow-hidden bg-black">
        <MapViewer />
        <GestureHUD />
        <Sidebar />
        <Controls />
        <GestureCam />
        
        <div className="absolute top-4 left-4 pointer-events-none z-50">
          <h1 className="text-3xl font-black tracking-tighter text-white drop-shadow-lg">
            GEO<span className="text-cyan-400">CORTEX</span>
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <p className="text-[10px] font-mono text-green-400 tracking-widest uppercase">
              System Online
            </p>
          </div>
        </div>
      </div>
    </GlobalProvider>
  );
};

export default App;