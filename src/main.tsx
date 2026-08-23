import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
import { I18nProvider } from './i18n';
import './styles.css';
import './advanced.css';
import './outline.css';
import './drop.css';
import './recovery.css';
import './accessibility.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Markora root element is missing.');
}

createRoot(root).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>,
);
