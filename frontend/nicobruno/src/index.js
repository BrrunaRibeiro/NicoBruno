import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Dashboard from './components/Dashboard.js';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Dashboard class={"Dashboard"}/>
  </React.StrictMode>
);

reportWebVitals();
