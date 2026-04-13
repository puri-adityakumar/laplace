import { createRoot } from 'react-dom/client';
import { Options } from './Options';
import '../styles/theme.css';

const root = createRoot(document.getElementById('root')!);
root.render(<Options />);
