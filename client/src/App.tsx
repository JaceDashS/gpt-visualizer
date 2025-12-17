import React, { useState } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import VisualizationContainer from './components/VisualizationContainer';
import HowItWorksPage from './pages/HowItWorksPage';
import FloatingNav from './components/layout/FloatingNav';
import AboutOverlay from './components/about/AboutOverlay';

function App() {
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const handleToggleAbout = () => {
    setIsAboutOpen(prev => !prev);
  };

  const handleNavigate = () => {
    // Home / How it works로 이동할 때 About 패널은 닫는다
    setIsAboutOpen(false);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<VisualizationContainer />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
      </Routes>
      <FloatingNav onToggleAbout={handleToggleAbout} onNavigate={handleNavigate} />
      <AboutOverlay isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </BrowserRouter>
  );
}

export default App;
