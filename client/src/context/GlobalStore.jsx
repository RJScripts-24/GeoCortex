import React, { createContext, useContext, useState } from "react";

const GlobalContext = createContext(null);

export const GlobalProvider = ({ children }) => {
  const [year, setYear] = useState(2024);
  const [activeLayer, setActiveLayer] = useState("none");
  const [gesture, setGesture] = useState("None");

  // AI Analysis (HTML → UI display)
  const [analysis, setAnalysis] = useState(null);

  //  Structured AI Analysis (JSON → PDF generation)
  const [structuredAnalysis, setStructuredAnalysis] = useState(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showConsultant, setShowConsultant] = useState(false);

  // Map-related state
  const [clickedLocation, setClickedLocation] = useState(null);
  const [mapImage, setMapImage] = useState(null);

  // Energy / Solar Mode
  const [isEnergyMode, setIsEnergyMode] = useState(false);

  return (
    <GlobalContext.Provider
      value={{
        // Year / Layer
        year,
        setYear,
        activeLayer,
        setActiveLayer,
        gesture,
        setGesture,

        // AI Analysis
        analysis,
        setAnalysis,

        //  Structured (PDF-safe)
        structuredAnalysis,
        setStructuredAnalysis,

        // UI State
        isAnalyzing,
        setIsAnalyzing,
        showConsultant,
        setShowConsultant,

        // Map State
        clickedLocation,
        setClickedLocation,
        mapImage,
        setMapImage,

        // Energy Mode
        isEnergyMode,
        setIsEnergyMode,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalStore = () => {
  const ctx = useContext(GlobalContext);
  if (!ctx) {
    throw new Error("useGlobalStore must be used inside GlobalProvider");
  }
  return ctx;
};
