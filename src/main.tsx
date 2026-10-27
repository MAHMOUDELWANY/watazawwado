import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {installErrorReporter} from './lib/errorReporter';
import {captureFirstTouch, captureReferral} from './lib/leadSource';
import {applyUrlLanguage} from './lib/language';
import {capturePwaInstall} from './lib/pwaInstall';
import {startBootSplash} from './lib/bootSplash';

installErrorReporter();
captureFirstTouch();
captureReferral();
// Keep Chrome's install offer for the "Get the app" buttons (it fires once, often before React mounts).
capturePwaInstall();
// An /en address opens the site in English and keeps that choice (QA-05b).
applyUrlLanguage(window.location.pathname);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
startBootSplash();
