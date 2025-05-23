import React from 'react';
import './customScrollbar.css';

function JsonCard({ entity }) {
  if (!entity || !entity.attributes) {
    console.error("Invalid collection format:", entity);
    return (
      <div className="json-card p-4 bg-gray-800 text-white rounded-lg shadow-md w-full">
        Invalid collection format
      </div>
    );
  }

  const renderAttribute = (key, value) => (
    <li key={key} className="truncate">
      <strong className="text-cyan-300">{key}:</strong>{" "}
      <span className="text-gray-300">{value.type}</span>
    </li>
  );

  return (
    <div className="json-card p-4 bg-gray-800 text-white rounded-lg shadow-lg min-w-[225px] min-h-[300px] max-h-[300px] max-w-[250px] border border-gray-700 overflow-auto overflow-x-auto custom-scrollbar">
      <h3 className="text-lg font-bold mb-2 text-cyan-400">{entity.name || "Unnamed Collection"}</h3>
      <hr className="border-gray-600 mb-2" />
      <ul className="text-sm space-y-1">
        {Object.entries(entity.attributes).map(([key, value]) =>
          renderAttribute(key, value)
        )}
      </ul>
    </div>
  );
}

export default JsonCard;
