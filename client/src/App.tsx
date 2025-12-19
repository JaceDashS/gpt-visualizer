import React, { useState } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import VisualizationContainer from './components/VisualizationContainer';
import HowItWorksPage from './pages/HowItWorksPage';
import FloatingNav from './components/layout/FloatingNav';
import AboutOverlay from './components/about/AboutOverlay';
import FeedbackOverlay from './components/feedback/FeedbackOverlay';
import { LanguageProvider } from './contexts/LanguageContext';

function App() {
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  const handleToggleAbout = () => {
    setIsAboutOpen(prev => !prev);
  };

  const handleToggleFeedback = () => {
    setIsFeedbackOpen(prev => !prev);
  };

  const handleNavigate = () => {
    // Home / How it works로 이동할 때 About/피드백 패널은 닫는다. 
    // 그런데 사실 버튼자체가 비활성화 되서 필요없을지도
    setIsAboutOpen(false);
    setIsFeedbackOpen(false);
  };

  return (
    <LanguageProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<VisualizationContainer />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
      </Routes>
        <FloatingNav 
          onToggleAbout={handleToggleAbout} 
          onToggleFeedback={handleToggleFeedback}
          onNavigate={handleNavigate} 
        />
      <AboutOverlay isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
        <FeedbackOverlay isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
    </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;
