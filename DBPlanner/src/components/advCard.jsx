import React, { useContext } from 'react';
import { SchemaContext } from '../SchemaContext';
import './customScrollbar.css';

function AdvCard({ entity, onEdit }) {
    const { setSelectedEntity, setOriginalSelectedEntity, setTempSelectedEntity } = useContext(SchemaContext);

    if (!entity || !entity.name || !entity.attributes) {
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
        const isObjectOrArray = value.type === 'object' || value.type === 'array';
        const properties = value.type === 'object' ? value.properties : value.items?.properties;

        return (
            <li key={key} className="truncate">
                <strong className="text-cyan-300">{key}:</strong>
                <span className="text-gray-300"> {value.type}</span>
                {value.isKey && <span className="text-yellow-400"> *</span>}
                {value.required && <span className="text-red-400"> *</span>}
                {isObjectOrArray && properties && (
                    <ul className="ml-4">
                        {Object.entries(properties).map(([subKey, subValue]) => (
                            <li key={subKey} className="truncate">
                                <strong className="text-cyan-300">{subKey}:</strong>
                                <span className="text-gray-300"> {subValue.type}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </li>
        );
    };

    return (
        <div className="json-card p-4 bg-gray-800 text-white rounded-lg shadow-lg min-w-[220px] min-h-[300px] max-h-[300px] max-w-[200px] border border-gray-700 overflow-auto overflow-x-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-bold text-cyan-400">{entity.name}</h3>
                <button onClick={handleEditClick} className="px-4 py-2 text-white min-h-10 rounded bg-blue-500 h-10 hover:bg-blue-600 border-blue-800 border-b-3">Edit</button>
            </div>
            <hr className="border-gray-600 mb-2" />
            <p className="text-gray-400 text-sm mb-2">{entity.description || 'No description'}</p>
            <ul className="text-sm space-y-1">
                {Object.entries(entity.attributes).map(([key, value]) => renderAttribute(key, value))}
            </ul>
        </div>
    );
}

export default AdvCard;