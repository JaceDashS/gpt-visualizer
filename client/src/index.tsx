import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/variables.css';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  // strict mode 사용하면 애니메이션이 2스탭씩 진행됨
  // <React.StrictMode>
    <App />
  // </React.StrictMode>
);
reportWebVitals();
