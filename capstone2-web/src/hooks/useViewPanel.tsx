import React, { useState, ReactNode, createContext, useContext } from 'react';

interface ViewPanelContextType {
  viewComponent: ReactNode;
  setView: (component: ReactNode) => void;
}

// Create a context for the view panel
const ViewPanelContext = createContext<ViewPanelContextType | undefined>(undefined);

// Provider component for the view panel
export const ViewPanelProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [viewComponent, setViewComponent] = useState<ReactNode>(null);

  const setView = (component: ReactNode) => {
    setViewComponent(component);
  };

  return (
    <ViewPanelContext.Provider value={{ viewComponent, setView }}>
      {children}
    </ViewPanelContext.Provider>
  );
};

// Custom hook to use the view panel
export const useViewPanel = () => {
  const context = useContext(ViewPanelContext);
  if (!context) {
    throw new Error("useViewPanel must be used within a ViewPanelProvider");
  }
  return context;
};
