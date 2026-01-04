import React from 'react';
import { useGlobalStore } from '../context/GlobalStore';
import { generatePDF } from '../utils/pdfGenerator';

const Sidebar = () => {
  const { analysis, isAnalyzing } = useGlobalStore();

  const handleDownload = () => {
    generatePDF(analysis);
  };

  return (
    <div 
      id="sidebar-panel"
      className="absolute top-4 right-4 w-96 max-h-[90vh] bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-white overflow-y-auto z-50 shadow-2xl"
    >
      <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
        <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse" />
        <h2 className="text-xl font-mono tracking-widest text-cyan-400">
          AI CONSULTANT
        </h2>
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
            <div className="prose prose-invert prose-sm">
              <p className="whitespace-pre-wrap font-sans text-gray-300 leading-relaxed">
                {analysis}
              </p>
            </div>
            
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
  );
};

export default Sidebar;