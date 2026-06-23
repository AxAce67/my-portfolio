import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Geist Sans has no Japanese glyphs, so pair it with Noto Sans JP — a
// properly-designed CJK font (correct fullwidth-punctuation spacing, etc.)
// instead of leaving Japanese text to whatever the OS substitutes in.
// Variable + unicode-range-chunked: the browser only fetches the small
// chunks covering characters actually on the page, not the whole ~5MB family
// in every weight like the static per-weight build would.
import '@fontsource-variable/noto-sans-jp';
import './app/fonts.css';
import './app/globals.css';
import './i18n/config';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
