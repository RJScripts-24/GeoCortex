import React from 'react';
import { useGlobalStore } from '../context/GlobalStore';

const Controls = () => {
  const { year, setYear, activeLayer, setActiveLayer } = useGlobalStore();

  const handleYearChange = (e) => {
    setYear(parseInt(e.target.value));
  };

  return (
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-[90%] max-w-5xl z-50">
      <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 px-8 py-4 flex flex-col gap-4">

        {/* Header Row: Title & Toggles */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-sm font-semibold text-slate-700 tracking-wide uppercase">
              Urban Change Timeline
            </h3>

            {/* Layer Toggles */}
            <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
              <button
                onClick={() => setActiveLayer('none')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeLayer === 'none' ? 'bg-white text-cyan-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Satellite
              </button>
              <button
                onClick={() => setActiveLayer('heat')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeLayer === 'heat' ? 'bg-white text-cyan-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Thermal
              </button>
              {/* Placeholder for Solar if implemented, otherwise just visual consistency */}
              <button
                onClick={() => setActiveLayer('solar')} // Assuming solar might be a layer or just visual for now
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeLayer === 'solar' ? 'bg-white text-cyan-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Solar
              </button>
            </div>
          </div>

          <div className="text-2xl font-light text-slate-800 font-mono">
            {year}
          </div>
        </div>

        {/* Slider Row */}
        <div className="relative w-full h-8 flex items-center">
          {/* Custom Track Background */}
          <div className="absolute w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-500/30"
              style={{ width: `${((year - 2015) / 10) * 100}%` }}
            />
          </div>

          <input
            type="range"
            min="2015"
            max="2025"
            value={year}
            onChange={handleYearChange}
            className="absolute w-full h-2 appearance-none bg-transparent cursor-pointer z-10 
                         focus:outline-none 
                         [&::-webkit-slider-thumb]:appearance-none 
                         [&::-webkit-slider-thumb]:w-6 
                         [&::-webkit-slider-thumb]:h-6 
                         [&::-webkit-slider-thumb]:rounded-full 
                         [&::-webkit-slider-thumb]:bg-white 
                         [&::-webkit-slider-thumb]:border-4 
                         [&::-webkit-slider-thumb]:border-cyan-500 
                         [&::-webkit-slider-thumb]:shadow-md 
                         [&::-webkit-slider-thumb]:transition-transform 
                         [&::-webkit-slider-thumb]:hover:scale-110"
          />

          {/* Year Markers */}
          <div className="absolute top-4 w-full flex justify-between px-1 pointer-events-none">
            {[2015, 2020, 2025].map(y => (
              <span key={y} className="text-[10px] text-gray-400 font-mono">{y}</span>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Controls;