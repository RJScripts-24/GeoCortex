import React, { createContext, useContext, useState } from 'react';

const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
  const [year, setYear] = useState(2024);
  const [activeLayer, setActiveLayer] = useState('none');
  const [gesture, setGesture] = useState('None');
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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
      setIsAnalyzing
    }}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalStore = () => useContext(GlobalContext);