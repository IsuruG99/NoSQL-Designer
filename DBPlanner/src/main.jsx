import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './index.css';

import Generate from './generate.jsx';
import Editor from './editor.jsx'; // Import the new page component
import { SchemaProvider } from './SchemaContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SchemaProvider>
      <Router>
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6">
          <h1 className="text-3xl font-bold mb-4">NoSQL Schema Generator</h1>

          <Routes>
            <Route path="/" element={<Generate />} />
            <Route path="/editor" element={<Editor />} />
          </Routes>
        </div>
      </Router>
    </SchemaProvider>
  </StrictMode>,
);