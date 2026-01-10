import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

const ROOT_ID = 'laplace-root';

function init() {
  if (!isPRPage()) return;

  const existingRoot = document.getElementById(ROOT_ID);
  if (existingRoot) return;

  const container = document.createElement('div');
  container.id = ROOT_ID;
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(<App />);
}

function isPRPage(): boolean {
  const path = window.location.pathname;
  return /\/pull\/\d+/.test(path) || path.includes('/compare/');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    setTimeout(init, 500);
  }
}).observe(document, { subtree: true, childList: true });
