import React from 'react';
import './customScrollbar.css';

function JsonCard({ entity }) {
    if (!entity || !entity.Name || !entity.Attributes) {
        console.error("Invalid entity data:", entity);
        return <div className="json-card p-4 bg-gray-800 text-white rounded-lg shadow-md w-full">Invalid entity data</div>;
    }

    const renderAttribute = (key, value) => {
        const isObjectOrArray = value.type === 'object' || value.type === 'array';
        const properties = value.type === 'object' ? value.properties : value.items?.properties;

        return (
            <li key={key} className="truncate">
                <strong className="text-cyan-300">{key}:</strong> <span className="text-gray-300">{value.type}</span>
                {isObjectOrArray && properties && (
                    <ul className="ml-4">
                        {Object.entries(properties).map(([subKey, subValue]) => (
                            <li key={subKey} className="truncate">
                                <strong className="text-cyan-300">{subKey}:</strong> <span className="text-gray-300">{subValue.type}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </li>
        );
    };

    return (
        <div className="json-card p-4 bg-gray-800 text-white rounded-lg shadow-lg min-w-[225px] min-h-[300px] max-h-[300px] max-w-[250px] border border-gray-700 overflow-auto overflow-x-auto custom-scrollbar">
            <h3 className="text-lg font-bold mb-2 text-cyan-400">{entity.Name}</h3>
            <hr className="border-gray-600 mb-2" />
            <ul className="text-sm space-y-1">
                {Object.entries(entity.Attributes).map(([key, value]) => renderAttribute(key, value))}
            </ul>
        </div>
    );
}

export default JsonCard;