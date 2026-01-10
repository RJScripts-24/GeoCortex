import React, { useState } from 'react';
import { useGlobalStore } from '../context/GlobalStore';

const Controls = ({ isMobile = false }) => {
  const { year, setYear, activeLayer, setActiveLayer } = useGlobalStore();
  const [showSolarPopup, setShowSolarPopup] = useState(false);

  const handleYearChange = (e) => {
    setYear(parseInt(e.target.value));
  };

  const handleSolarClick = () => {
    setShowSolarPopup(true);
  };

  // Mobile: relative positioning within flex layout, fills parent container
  // Desktop: absolute positioning at bottom center
  const containerClasses = isMobile
    ? "relative w-full h-full flex items-center justify-center z-50"
    : "absolute bottom-6 left-1/2 transform -translate-x-1/2 w-[90%] max-w-5xl z-50";

  return (
    <>
      {/* Solar Coverage Popup */}
      {showSolarPopup && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
          }}
          onClick={() => setShowSolarPopup(false)}
        >
          <div
            className="animate-in fade-in zoom-in duration-300"
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '420px',
              width: '90%',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '2.5rem', marginRight: '12px' }}>☀️</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>
                  Solar View
                </h3>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                  Coverage Status
                </p>
              </div>
            </div>

            {/* Message */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
              border: '1px solid #fde68a',
              marginBottom: '24px'
            }}>
              <span style={{ fontSize: '1.5rem', marginRight: '12px' }}>🚧</span>
              <p style={{ margin: 0, fontSize: '0.95rem', color: '#92400e', lineHeight: '1.5' }}>
                Solar coverage has still not been done for Bangalore by Google. Kindly wait for updates.
              </p>
            </div>

            {/* Close Button */}
            <button
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
              }}
              onClick={() => setShowSolarPopup(false)}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.02)';
                e.target.style.boxShadow = '0 6px 20px rgba(245, 158, 11, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = '0 4px 14px rgba(245, 158, 11, 0.4)';
              }}
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      <div className={containerClasses}>
        <div className={`bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 flex flex-col gap-4 ${isMobile ? 'px-4 py-2 w-[95%]' : 'px-8 py-4'}`}>

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
                {/* Solar View - shows popup instead of changing layer */}
                <button
                  onClick={handleSolarClick}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all text-gray-500 hover:text-gray-700`}
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
    </>
  );
};

export default Controls;