import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Import ported CSS files
import './css/reset.css';
import './css/variables.css';
import './css/main.css';
import './css/typing.css';
import './css/results.css';
import './css/responsive.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

