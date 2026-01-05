import React, { useState } from 'react';
import { useGlobalStore } from '../context/GlobalStore';
import { generatePDF } from '../utils/pdfGenerator';
import Chatbot from './Chatbot';

const Sidebar = () => {

  const {
    analysis,                 // HTML for UI
    structuredAnalysis,       // ✅ JSON for PDF
    isAnalyzing,
    showConsultant,
    setShowConsultant,
    clickedLocation,
    isEnergyMode,
    setIsEnergyMode
  } = useGlobalStore();

  // Chatbot state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  // ---------------- CHATBOT ----------------
  const handleChatSend = async (userMsg) => {
    setChatMessages((msgs) => [...msgs, { role: 'user', text: userMsg }]);
    setChatLoading(true);

    try {
      const lat = clickedLocation?.lat;
      const lng = clickedLocation?.lng;
      const year = window?.storeYear || 2025;

      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMsg, lat, lng, year })
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages((msgs) => [...msgs, { role: 'ai', text: data.answer }]);
      } else {
        setChatMessages((msgs) => [...msgs, { role: 'ai', text: 'AI failed to respond.' }]);
      }
    } catch {
      setChatMessages((msgs) => [...msgs, { role: 'ai', text: 'Backend connection error.' }]);
    }

    setChatLoading(false);
  };

  // ---------------- PDF DOWNLOAD ----------------
  const handleDownload = () => {
    if (!structuredAnalysis || !clickedLocation) {
      alert("Please run analysis before downloading the report.");
      return;
    }

    generatePDF(
      structuredAnalysis,   // ✅ JSON ONLY
      clickedLocation,
      chatMessages
    );
  };

  return (
    <>
      {/* Solar Flux Toggle */}
      <div className="fixed left-4 top-20 z-[102]">
        <button
          onClick={() => setIsEnergyMode(v => !v)}
          style={{
            background: isEnergyMode ? '#ffe066' : '#fff',
            border: '1px solid #ccc',
            padding: '10px 18px',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {isEnergyMode ? 'Exit Solar Flux Map' : 'Solar Flux Map'}
        </button>
      </div>

      {showConsultant && (
        <div
          className="fixed right-4 top-20 w-96 max-h-[90vh] bg-black/60 backdrop-blur-xl
                     border border-white/10 rounded-2xl p-6 text-white overflow-y-auto
                     z-[101] shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
            <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse" />
            <h2 className="text-xl font-mono tracking-widest text-cyan-400">
              AI CONSULTANT
            </h2>
            <button
              className="ml-auto px-2 py-1 text-xs border border-gray-700 rounded"
              onClick={() => setShowConsultant(false)}
            >
              Close
            </button>
          </div>

          {/* Body */}
          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center h-40 gap-4">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              <span className="font-mono text-sm text-cyan-300 animate-pulse">
                ANALYZING SATELLITE DATA...
              </span>
            </div>
          ) : analysis ? (
            <>
              {/* Analysis HTML */}
              <div
                style={{ color: '#d1d5db', fontSize: '1rem', lineHeight: '1.6' }}
                dangerouslySetInnerHTML={{ __html: analysis }}
              />

              {/* Download Button */}
              <div className="pt-4 border-t border-white/10 mt-4">
                <button
                  onClick={handleDownload}
                  className="w-full py-3 bg-cyan-500/10 hover:bg-cyan-500/20
                             border border-cyan-500/50 rounded-lg text-cyan-400
                             font-mono text-sm flex items-center justify-center gap-2"
                >
                  DOWNLOAD REPORT
                </button>
              </div>

              {/* Chatbot */}
              <Chatbot onSend={handleChatSend} messages={chatMessages} />
              {chatLoading && (
                <div className="text-cyan-300 text-xs mt-2 animate-pulse">
                  AI is typing...
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-500 py-10 font-mono text-sm">
              NO ACTIVE ANALYSIS
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Sidebar;
