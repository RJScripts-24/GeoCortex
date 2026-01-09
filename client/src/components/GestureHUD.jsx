import React from 'react';
import { useGlobalStore } from '../context/GlobalStore';

const GestureHUD = () => {
  const { gesture } = useGlobalStore();

  if (!gesture || gesture === 'None') return null;

  const getFeedback = () => {
    switch (gesture) {
      case 'Open_Palm':
        return { text: 'MOVEMENT PAUSED', color: 'text-amber-600', border: 'border-amber-500' };
      case 'Closed_Fist':
        return { text: 'THERMAL MODE', color: 'text-orange-600', border: 'border-orange-500' };
      case 'Pointing_Up':
        return { text: 'SATELLITE MODE', color: 'text-green-600', border: 'border-green-500' };
      default:
        return { text: gesture.toUpperCase(), color: 'text-slate-700', border: 'border-gray-200' };
    }
  };

  const { text, color, border } = getFeedback();

  return (
    <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-40 pointer-events-none">
      <div className={`flex items-center gap-3 px-6 py-2 bg-white/80 backdrop-blur-md rounded-full border shadow-lg ${border} transition-all duration-300 animate-in fade-in slide-in-from-top-4`}>
        <div className={`w-3 h-3 rounded-full animate-ping ${color.replace('text', 'bg')}`} />
        <span className={`font-mono font-bold tracking-widest ${color}`}>
          {text}
        </span>
      </div>
    </div>
  );
};

export default GestureHUD;