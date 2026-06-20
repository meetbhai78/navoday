import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { Provider } from 'react-redux';
import { store } from './store/index.js';
import axios from 'axios';

// Configure global API baseURL for both Web and Capacitor Android environments
axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
