import React, { createContext, useContext, useState, ReactNode } from 'react';
import { DEFAULT_FONT_SIZE } from '../constants/visualization';

interface TextSizeContextType {
  fontSize: number;
  setFontSize: (size: number) => void;
  easterEggActive: boolean;
  setEasterEggActive: (active: boolean) => void;
}

const TextSizeContext = createContext<TextSizeContextType | undefined>(undefined);

export const TextSizeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [fontSize, setFontSize] = useState<number>(DEFAULT_FONT_SIZE);
  const [easterEggActive, setEasterEggActive] = useState<boolean>(false);

  return (
    <TextSizeContext.Provider value={{ fontSize, setFontSize, easterEggActive, setEasterEggActive }}>
      {children}
    </TextSizeContext.Provider>
  );
};

export const useTextSize = (): TextSizeContextType => {
  const context = useContext(TextSizeContext);
  if (!context) {
    throw new Error('useTextSize must be used within TextSizeProvider');
  }
  return context;
};

