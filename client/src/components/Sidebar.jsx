import React, { useState } from 'react';
import { useGlobalStore } from '../context/GlobalStore';
import { generatePDF } from '../utils/pdfGenerator';
import { API_BASE_URL } from '../config/api.js';

import Chatbot from './Chatbot';

const Sidebar = () => {

  const { analysis, isAnalyzing, showConsultant, setShowConsultant, clickedLocation, mapImage, isEnergyMode, setIsEnergyMode, analysisView } = useGlobalStore();

  // Chatbot state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [enlarged, setEnlarged] = useState(false);

  // Connect to backend chatbot endpoint
  const handleChatSend = async (userMsg) => {
    setChatMessages((msgs) => [...msgs, { role: 'user', text: userMsg }]);
    setChatLoading(true);
    try {
      // Use last clicked location and year from global store
      const lat = clickedLocation?.lat;
      const lng = clickedLocation?.lng;
      const year = (window?.storeYear) || 2025; // fallback if not in global
      // Try to get from global store if available
      let y = year;
      try { y = window?.storeYear || year; } catch { }
      const res = await fetch(`${API_BASE_URL}/api/chatbot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMsg,
          lat,
          lng,
          year: y
        })
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages((msgs) => [...msgs, { role: 'ai', text: data.answer }]);
      } else {
        setChatMessages((msgs) => [...msgs, { role: 'ai', text: 'AI failed to answer. Please try again.' }]);
      }
    } catch (err) {
      setChatMessages((msgs) => [...msgs, { role: 'ai', text: 'Error connecting to AI backend.' }]);
    }
    setChatLoading(false);
  };

  const handleDownload = () => {
    generatePDF(analysis, clickedLocation, mapImage, chatMessages, analysisView);
  };

  return (
    <>
      {showConsultant && (
        <div
          id="sidebar-panel"
          className={`absolute right-4 top-20 ${enlarged ? 'w-[700px] h-[85vh]' : 'w-96 h-[80vh]'} bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-[101] transition-all duration-300`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-600 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800 tracking-wide uppercase">AI Consultant</h2>
                <p className="text-[10px] text-gray-500 font-mono">POWERED BY GEMINI</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                className="p-1.5 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                onClick={() => setEnlarged((v) => !v)}
                title={enlarged ? 'Shrink' : 'Enlarge'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={enlarged ? "M9 9L4 4m0 0l5 0m-5 0l0 5M15 15l5 5m0 0l-5 0m5 0l0-5" : "M4 8V4m0 0h4M20 8V4m0 0h-4M4 16v4m0 0h4M20 16v4m0 0h-4"} /></svg>
              </button>
              <button
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                onClick={() => setShowConsultant(false)}
                title="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 opacity-70">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-cyan-100 rounded-full animate-spin border-t-cyan-500" />
                </div>
                <span className="font-mono text-xs text-cyan-600 font-medium tracking-widest animate-pulse">
                  ANALYZING SATELLITE DATA...
                </span>
              </div>
            ) : analysis ? (
              <div className="space-y-6">
                <div
                  className="prose prose-sm prose-slate max-w-none"
                  dangerouslySetInnerHTML={{ __html: analysis }}
                />

                <div className="pt-4 border-t border-gray-100">
                  <button
                    onClick={handleDownload}
                    className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg shadow-md shadow-cyan-200/50 text-sm font-medium transition-all flex items-center justify-center gap-2 group transform active:scale-[0.98]"
                  >
                    <span>Download Report</span>
                    <svg className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                </div>

                {/* Chatbot Interface */}
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <Chatbot onSend={handleChatSend} messages={chatMessages} lightTheme={true} />
                  {chatLoading && <div className="text-xs text-gray-400 mt-2 ml-2 italic">Generating response...</div>}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <p className="font-medium text-slate-600">No Active Analysis</p>
                <p className="mt-1 text-xs max-w-[200px]">
                  Select a location on the map to initiate AI-powered analysis.
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