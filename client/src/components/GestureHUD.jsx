import React from 'react';
import { useGlobalStore } from '../context/GlobalStore';

const GestureHUD = () => {
  const { gesture } = useGlobalStore();

  if (!gesture || gesture === 'None') return null;

  const getFeedback = () => {
    switch(gesture) {
      case 'Open_Palm':
        return { text: 'MOVEMENT PAUSED', color: 'text-yellow-400', border: 'border-yellow-400' };
      case 'Closed_Fist':
        return { text: 'ZOOM ACTIVE', color: 'text-red-500', border: 'border-red-500' };
      case 'Pointing_Up':
        return { text: 'RESET VIEW', color: 'text-cyan-400', border: 'border-cyan-400' };
      default:
        return { text: gesture.toUpperCase(), color: 'text-white', border: 'border-white' };
    }
  };

  const { text, color, border } = getFeedback();

  return (
    <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-40 pointer-events-none">
      <div className={`flex items-center gap-3 px-6 py-2 bg-black/60 backdrop-blur-sm rounded-full border ${border} transition-all duration-300 animate-in fade-in slide-in-from-top-4`}>
        <div className={`w-3 h-3 rounded-full animate-ping ${color.replace('text', 'bg')}`} />
        <span className={`font-mono font-bold tracking-widest ${color}`}>
          {text}
        </span>
      </div>
    </div>
  );
};

export default GestureHUD;