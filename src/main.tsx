import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Temporarily disable StrictMode to prevent double mounting in development
createRoot(document.getElementById('root')!).render(
  <App />
);
