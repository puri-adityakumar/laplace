import { createRoot } from 'react-dom/client';
import { Popup } from './Popup';
import '../styles/theme.css';

const root = createRoot(document.getElementById('root')!);
root.render(<Popup />);
