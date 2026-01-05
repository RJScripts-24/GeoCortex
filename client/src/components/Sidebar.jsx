import React from 'react';
import { useGlobalStore } from '../context/GlobalStore';
import { generatePDF } from '../utils/pdfGenerator';

const Sidebar = () => {
  const { analysis, isAnalyzing, showConsultant, setShowConsultant, clickedLocation, mapImage, isEnergyMode, setIsEnergyMode } = useGlobalStore();

  const handleDownload = () => {
    // Remove all HTML tags and decode entities for clean text
    const htmlToText = (html) => {
      // Remove tags
      let text = html.replace(/<[^>]+>/g, ' ');
      // Decode HTML entities
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = text;
      return tempDiv.textContent || tempDiv.innerText || '';
    };
    generatePDF(htmlToText(analysis), clickedLocation, mapImage);
  };

  return (
    <>
      {/* Solar Flux Map Button (Energy Mode) */}
      <div className="fixed left-4 top-20 z-[102]">
        <button
          onClick={() => setIsEnergyMode((v) => !v)}
          style={{
            background: isEnergyMode ? '#ffe066' : '#fff',
            border: '1px solid #ccc',
            margin: '10px 0',
            cursor: 'pointer',
            padding: '10px 18px',
            borderRadius: '8px',
            fontWeight: 600,
            color: '#222',
            boxShadow: isEnergyMode ? '0 0 8px #ffe066' : 'none',
            transition: 'all 0.2s'
          }}
        >
          {isEnergyMode ? 'Exit Solar Flux Map' : 'Solar Flux Map'}
        </button>
      </div>
      {/* ...existing code... */}
      {showConsultant && (
        <div 
          id="sidebar-panel"
          className="fixed right-4 top-20 w-96 max-h-[90vh] bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-white overflow-y-auto z-[101] shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
        <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse" />
        <h2 className="text-xl font-mono tracking-widest text-cyan-400">
          AI CONSULTANT
        </h2>
        <button
          className="ml-auto px-2 py-1 text-xs text-gray-400 hover:text-white border border-gray-700 rounded"
          onClick={() => setShowConsultant(false)}
        >Close</button>
      </div>

      <div className="min-h-[200px]">
        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center h-40 gap-4">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <span className="font-mono text-sm text-cyan-300 animate-pulse">
              ANALYZING SATELLITE DATA...
            </span>
          </div>
        ) : analysis ? (
          <div className="space-y-4">
            <div 
              style={{
                color: '#d1d5db',
                fontSize: '1rem',
                lineHeight: '1.6'
              }}
              dangerouslySetInnerHTML={{ __html: analysis }} 
            />
            
            <div className="pt-4 border-t border-white/10 mt-4">
              <button
                onClick={handleDownload}
                className="w-full py-3 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/50 rounded-lg text-cyan-400 font-mono text-sm transition-all flex items-center justify-center gap-2 group"
              >
                <span>DOWNLOAD REPORT</span>
                <svg className="w-4 h-4 group-hover:translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-10 font-mono text-sm">
            <p>NO ACTIVE ANALYSIS</p>
            <p className="mt-2 text-xs opacity-50">
              CLICK ANY LOCATION ON THE MAP TO INITIATE THERMAL INSPECTION
            </p>
          </div>
        )}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;