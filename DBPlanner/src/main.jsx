import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { SchemaProvider } from './context/SchemaContext.jsx';
import Generate from './generatePage.jsx';
import Editor from './editorPage.jsx';
import Export from './exportPage.jsx';
import './css/index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SchemaProvider>
      <Router>
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6">
          <nav className="w-full flex justify-around bg-gray-800 p-4 mb-4">
            <Link to="/" className="text-xl font-bold text-white">Generate</Link>
            <Link to="/editor" className="text-xl font-bold text-white">Design</Link>
            <Link to="/export" className="text-xl font-bold text-white">Export</Link>
          </nav>
          <h1 className="text-3xl font-bold mb-4 text-center">NoSQL - Designer</h1>

          <Routes>
            <Route path="/" element={<Generate />} />
            <Route path="/editor" element={<Editor />} />
            <Route path="/export" element={<Export />} />
          </Routes>
        </div>
      </Router>
    </SchemaProvider>
  </StrictMode>,
);