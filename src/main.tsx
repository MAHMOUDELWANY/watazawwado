import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {installErrorReporter} from './lib/errorReporter';
import {captureFirstTouch, captureReferral} from './lib/leadSource';
import {applyUrlLanguage} from './lib/language';

installErrorReporter();
captureFirstTouch();
captureReferral();
// An /en address opens the site in English and keeps that choice (QA-05b).
applyUrlLanguage(window.location.pathname);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
