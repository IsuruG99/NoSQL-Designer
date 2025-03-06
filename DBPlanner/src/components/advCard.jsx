import React, { useContext } from 'react';
import { SchemaContext } from '../SchemaContext';
import './customScrollbar.css'; // Import the custom CSS file

function AdvCard({ entity, onEdit }) {
    const { setSelectedEntity, setOriginalSelectedEntity, setTempSelectedEntity } = useContext(SchemaContext);

    if (!entity || !entity.Name || !entity.Attributes) {
        console.error("Invalid entity data:", entity);
        return <div className="json-card p-4 bg-gray-800 text-white rounded-lg shadow-md">Invalid entity data</div>;
    }

    const handleEditClick = () => {
        setSelectedEntity(entity);
        setOriginalSelectedEntity(entity);
        setTempSelectedEntity({ ...entity });
        onEdit();
    };

    const renderAttribute = (key, value) => {
        if (typeof value === 'object' && value !== null) {
            if (value.type === 'object') {
                return (
                    <li key={key} className="truncate">
                        <strong className="text-cyan-300">{key}:</strong>
                        <ul className="ml-4">
                            {Object.entries(value.properties).map(([subKey, subValue]) => (
                                <li key={subKey} className="truncate">
                                    <strong className="text-cyan-300">{subKey}:</strong> <span className="text-gray-300">{subValue}</span>
                                </li>
                            ))}
                        </ul>
                    </li>
                );
            } else if (value.type === 'array') {
                return (
                    <li key={key} className="truncate">
                        <strong className="text-cyan-300">{key}:</strong>
                        <ul className="ml-4">
                            {Object.entries(value.items.properties).map(([subKey, subValue]) => (
                                <li key={subKey} className="truncate">
                                    <strong className="text-cyan-300">{subKey}:</strong> <span className="text-gray-300">{subValue}</span>
                                </li>
                            ))}
                        </ul>
                    </li>
                );
            }
        } else {
            return (
                <li key={key} className="truncate">
                    <strong className="text-cyan-300">{key}:</strong> <span className="text-gray-300">{value}</span>
                </li>
            );
        }
    };

    return (
        <div className="json-card p-4 bg-gray-800 text-white rounded-lg shadow-lg min-w-[200px] min-h-[300px] max-h-[300px] max-w-[200px] border border-gray-700 overflow-auto overflow-x-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-bold text-cyan-400">{entity.Name}</h3>
                <button onClick={handleEditClick} className="px-4 py-2 bg-blue-500 text-white min-h-10 rounded">Edit</button>
            </div>
            <hr className="border-gray-600 mb-2" />
            <ul className="text-sm space-y-1">
                {Object.entries(entity.Attributes).map(([key, value]) => renderAttribute(key, value))}
            </ul>
        </div>
    );
}

export default AdvCard;