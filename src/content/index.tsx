import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

const ROOT_ID = 'laplace-root';

function init() {
  // Mount React app if not already mounted
  const existingRoot = document.getElementById(ROOT_ID);
  if (existingRoot) return;

  const container = document.createElement('div');
  container.id = ROOT_ID;
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(<App />);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
