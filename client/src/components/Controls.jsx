import React from 'react';
import { useGlobalStore } from '../context/GlobalStore';

const Controls = () => {
  const { year, setYear, activeLayer, setActiveLayer } = useGlobalStore();

  const handleYearChange = (e) => {
    setYear(parseInt(e.target.value));
  };

  return (
    <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-md p-4 rounded-xl border border-white/20 text-white w-96 z-50">
      <div className="flex flex-col gap-4">
        
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-xs font-mono text-cyan-400">
            <span>TIMELINE</span>
            <span>{year}</span>
          </div>
          <input 
            type="range" 
            min="2015" 
            max="2025" 
            value={year} 
            onChange={handleYearChange}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
          <div className="flex justify-between text-[10px] text-gray-400">
            <span>2015</span>
            <span>2025</span>
          </div>
        </div>

        <div className="h-px bg-white/10 w-full" />

        <div className="flex gap-2 justify-center">
          <button 
            onClick={() => setActiveLayer('none')}
            className={`px-3 py-1 text-xs rounded border transition-all ${
              activeLayer === 'none' 
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.5)]' 
                : 'border-white/10 hover:bg-white/5 text-gray-400'
            }`}
          >
            SATELLITE
          </button>
          <button 
            onClick={() => setActiveLayer('heat')}
            className={`px-3 py-1 text-xs rounded border transition-all ${
              activeLayer === 'heat' 
                ? 'bg-red-500/20 border-red-500 text-red-300 shadow-[0_0_10px_rgba(239,68,68,0.5)]' 
                : 'border-white/10 hover:bg-white/5 text-gray-400'
            }`}
          >
            THERMAL X-RAY
          </button>
        </div>

      </div>
    </div>
  );
};

export default Controls;