import { createRoot } from 'react-dom/client';
import { Popup } from './Popup';
import '../content/styles.css';

const root = createRoot(document.getElementById('root')!);
root.render(<Popup />);
