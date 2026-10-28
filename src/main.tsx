import {StrictMode} from 'react';
import {createRoot, hydrateRoot} from 'react-dom/client';
import App, {preloadPage} from './App.tsx';
import './index.css';
import {installErrorReporter} from './lib/errorReporter';
import {captureFirstTouch, captureReferral} from './lib/leadSource';
import {applyUrlLanguage, getStoredLanguage, pathLanguage} from './lib/language';
import {capturePwaInstall} from './lib/pwaInstall';
import {startBootSplash} from './lib/bootSplash';

installErrorReporter();
captureFirstTouch();
captureReferral();
// Keep Chrome's install offer for the "Get the app" buttons (it fires once, often before React mounts).
capturePwaInstall();
// An /en address opens the site in English and keeps that choice (QA-05b).
applyUrlLanguage(window.location.pathname);

const root = document.getElementById('root')!;
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);
// A prerendered public page is hydrated, not drawn again, when it was built in the language this visitor gets.
// Otherwise (account areas, or an Arabic chooser on an English page about to move to /ar) render from scratch.
const {pathname} = window.location;
if (root.hasAttribute('data-prerendered') && getStoredLanguage() === pathLanguage(pathname)) {
  // If the page's code fails to load, hydrating still works: the route's own loader retries or reloads.
  preloadPage(pathname).catch(() => {}).then(() => hydrateRoot(root, app));
} else {
  createRoot(root).render(app);
}
startBootSplash();
