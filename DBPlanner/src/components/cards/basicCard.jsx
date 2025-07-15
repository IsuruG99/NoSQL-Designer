import React from 'react';
import { KeyIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';
import '../../css/customScrollbar.css';

/**
 * JsonCard - renders a collection with nested attributes.
 * Shows keys, required flags, types, and nested objects/arrays.
 * 
 * @param entity - collection object with attributes to display
 */
function JsonCard({ entity }) {
  if (!entity || !entity.attributes) {
    console.error("Invalid collection format:", entity);
    return (
      <div className="json-card p-4 bg-gray-800 text-white rounded-lg shadow-md w-full">
        Invalid collection format
      </div>
    );
  }

  // Recursive render for nested attributes
  const renderAttribute = (key, value, depth = 0) => {
    const star = value.isKey ? (
  <KeyIcon className="ml-1 inline h-2 w-2 text-yellow-400" title="Primary Key" />
) : null;
    const required = value.required ? (
      <ExclamationCircleIcon className="ml-1 inline h-2 w-2 text-red-400" title="Required" />
    ) : null;

    if (value.type === "object" && value.properties && Object.keys(value.properties).length > 0) {
      return (
        <li key={key} className="truncate">
          <strong className="text-cyan-300">{key}:</strong>{" "}
          <span className="text-gray-300">object</span>
          {star} {required}
          <ul className="ml-4 border-l border-gray-600 pl-2">
            {Object.entries(value.properties).map(([subKey, subVal]) =>
              renderAttribute(subKey, subVal, depth + 1)
            )}
          </ul>
        </li>
      );
    }
    if (value.type === "array" && value.items) {
      return (
        <li key={key} className="truncate">
          <strong className="text-cyan-300">{key}:</strong>{" "}
          <span className="text-gray-300">array</span>
          {value.items.type === "object" && value.items.properties ? (
            <ul className="ml-4 border-l border-gray-600 pl-2">
              {Object.entries(value.items.properties).map(([subKey, subVal]) =>
                renderAttribute(subKey, subVal, depth + 1)
              )}
            </ul>
          ) : (
            <span className="text-gray-400 ml-2">[{value.items.type}]</span>
          )}
        </li>
      );
    }
    // Primitive
    return (
      <li key={key} className="truncate">
        <strong className="text-cyan-300">{key}:</strong>{" "}
        <span className="text-gray-300">{value.type}{star}{required}</span>
      </li>
    );
  };

  return (
    <div className="json-card p-4 bg-gray-800 text-white rounded-lg shadow-lg
    min-w-[225px] min-h-[300px] max-h-[300px] max-w-[250px] border border-gray-700 overflow-auto overflow-x-auto custom-scrollbar">
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