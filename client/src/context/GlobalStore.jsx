import React, { createContext, useContext, useState } from 'react';

const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
  const [year, setYear] = useState(2024);
  const [activeLayer, setActiveLayer] = useState('none');
  const [gesture, setGesture] = useState('None');
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showConsultant, setShowConsultant] = useState(false);
  const [clickedLocation, setClickedLocation] = useState(null);
  const [mapImage, setMapImage] = useState(null);
  // Energy Mode state
  const [isEnergyMode, setIsEnergyMode] = useState(false);

  return (
    <GlobalContext.Provider value={{
      year,
      setYear,
      activeLayer,
      setActiveLayer,
      gesture,
      setGesture,
      analysis,
      setAnalysis,
      isAnalyzing,
      setIsAnalyzing,
      showConsultant,
      clickedLocation,
      setClickedLocation,
      mapImage,
      setMapImage,
      setShowConsultant,
      isEnergyMode,
      setIsEnergyMode
    }}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalStore = () => useContext(GlobalContext);