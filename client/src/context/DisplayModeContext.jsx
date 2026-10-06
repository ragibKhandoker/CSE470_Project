import React, { createContext, useContext, useEffect, useState } from 'react';

const DisplayModeContext = createContext(null);
const COLOR_SCHEMES = ['navy', 'orange', 'navy-green'];
const STORAGE_KEY = 'sharemeal-color-scheme';

const getInitialColorScheme = () => {
  const savedScheme = window.localStorage.getItem(STORAGE_KEY);
  if (COLOR_SCHEMES.includes(savedScheme)) return savedScheme;

  return 'navy';
};

export const DisplayModeProvider = ({ children }) => {
  const [colorScheme, setColorScheme] = useState(getInitialColorScheme);

  useEffect(() => {
    document.documentElement.dataset.colorScheme = colorScheme;
    window.localStorage.setItem(STORAGE_KEY, colorScheme);
  }, [colorScheme]);

  const toggleColorScheme = () => {
    setColorScheme((currentScheme) => {
      const currentIndex = COLOR_SCHEMES.indexOf(currentScheme);
      return COLOR_SCHEMES[(currentIndex + 1) % COLOR_SCHEMES.length];
    });
  };

  return (
    <DisplayModeContext.Provider value={{ colorScheme, toggleColorScheme }}>
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
