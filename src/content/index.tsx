import { createRoot } from 'react-dom/client';
import { App } from './App';

function init() {
  const existingRoot = document.getElementById('pr-bot-root');
  if (existingRoot) return;

  const container = document.createElement('div');
  container.id = 'pr-bot-root';
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(<App />);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
