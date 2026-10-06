import React, { createContext, useContext, useEffect, useState } from 'react';

const DisplayModeContext = createContext(null);
const DISPLAY_MODES = ['color', 'contrast-light', 'contrast-dark'];
const STORAGE_KEY = 'sharemeal-display-mode';

const getInitialDisplayMode = () => {
  const savedMode = window.localStorage.getItem(STORAGE_KEY);
  return DISPLAY_MODES.includes(savedMode) ? savedMode : 'color';
};

export const DisplayModeProvider = ({ children }) => {
  const [displayMode, setDisplayMode] = useState(getInitialDisplayMode);

  useEffect(() => {
    document.documentElement.dataset.displayMode = displayMode;
    window.localStorage.setItem(STORAGE_KEY, displayMode);
  }, [displayMode]);

  const cycleDisplayMode = () => {
    setDisplayMode((currentMode) => {
      const currentIndex = DISPLAY_MODES.indexOf(currentMode);
      return DISPLAY_MODES[(currentIndex + 1) % DISPLAY_MODES.length];
    });
  };

  return (
    <DisplayModeContext.Provider value={{ displayMode, cycleDisplayMode }}>
      {children}
    </DisplayModeContext.Provider>
  );
};

export const useDisplayMode = () => {
  const context = useContext(DisplayModeContext);
  if (!context) {
    throw new Error('useDisplayMode must be used within a DisplayModeProvider');
  }
  return context;
};
