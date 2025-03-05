import React from 'react';

function JsonCard({ entity }) {
    if (!entity || !entity.Name || !entity.Attributes) {
        console.error("Invalid entity data:", entity);
        return <div className="json-card p-4 bg-gray-800 text-white rounded-lg shadow-md">Invalid entity data</div>;
    }

    return (
        <div className="json-card p-4 bg-gray-800 text-white rounded-lg shadow-lg min-w-[220px] h-full border border-gray-700">
            <h3 className="text-lg font-bold mb-2 text-cyan-400">{entity.Name}</h3>
            <hr className="border-gray-600 mb-2" />
            <ul className="text-sm space-y-1">
                {Object.entries(entity.Attributes).map(([key, value]) => (
                    <li key={key} className="truncate">
                        <strong className="text-cyan-300">{key}:</strong> <span className="text-gray-300">{value}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default JsonCard;