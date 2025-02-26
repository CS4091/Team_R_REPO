import React, { createContext, useContext, useState, useCallback } from 'react';

// Define the shape of our context
type MapViewContextType = {
    setView: (newView: __esri.MapView) => void;
    getView: () => __esri.MapView | null;
};

// Create a default value matching the type, but with dummy functions
const defaultContextValue: MapViewContextType = {
    setView: () => {
      throw new Error('setView function must be used within a MapViewProvider');
    },
    getView: () => null,
  };
  

// Create a context for the MapView
const MapViewContext = createContext<MapViewContextType>(defaultContextValue);

// Create a provider component
export const MapViewProvider = ({ children }: { children: React.ReactNode }) => {
  const [view, setView] = useState<__esri.MapView | null>(null);

  // Function to set the MapView instance
  const handleSetView = useCallback((newView: __esri.MapView) => {
    setView(newView);
  }, []);

  // Function to get the current MapView instance
  const handleGetView = useCallback(() => view, [view]);

  return (
    <MapViewContext.Provider value={{ setView: handleSetView, getView: handleGetView }}>
      {children}
    </MapViewContext.Provider>
  );
};

// Custom hook to use the MapViewContext
export const useMapView = () => {
  const context = useContext(MapViewContext);
  if (!context) {
    throw new Error('useMapView must be used within a MapViewProvider');
  }
  return context;
};
