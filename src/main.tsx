import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Self-hosted Geist (the original font, dropped during the Next.js -> Vite
// migration) so typography is consistent across devices instead of each
// OS's own system-ui default (Segoe UI / San Francisco / Roboto, etc.).
import '@fontsource/geist-sans/latin-300.css';
import '@fontsource/geist-sans/latin-400.css';
import '@fontsource/geist-sans/latin-500.css';
import '@fontsource/geist-sans/latin-600.css';
import '@fontsource/geist-sans/latin-700.css';
import '@fontsource/geist-sans/latin-900.css';
import '@fontsource/geist-mono/latin-400.css';
import '@fontsource/geist-mono/latin-500.css';
import '@fontsource/geist-mono/latin-700.css';
// Geist Sans has no Japanese glyphs, so pair it with Noto Sans JP — a
// properly-designed CJK font (correct fullwidth-punctuation spacing, etc.)
// instead of leaving Japanese text to whatever the OS substitutes in.
// Variable + unicode-range-chunked: the browser only fetches the small
// chunks covering characters actually on the page, not the whole ~5MB family
// in every weight like the static per-weight build would.
import '@fontsource-variable/noto-sans-jp';
import './app/globals.css';
import './i18n/config';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
