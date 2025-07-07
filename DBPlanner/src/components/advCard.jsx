import React, { useContext } from 'react';
import { SchemaContext } from '../SchemaContext';
import { KeyIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';
import './customScrollbar.css';

function AdvCard({ entity, onEdit, dragHandleprops }) {
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
        if (value.subtype === "enum" && value.values) {
            const maxEnum = 3;
            const shown = value.values.slice(0, maxEnum);
            const hasMore = value.values.length > maxEnum;
            return (
                <li key={key} className="break-words">
                    <strong className="text-cyan-300">{key}:</strong>
                    <span className="text-gray-300"> enum</span>
                    {value.isKey && <KeyIcon className="ml-1 inline h-3 w-3 text-yellow-400" title="Primary Key" />}
                    {value.required && <ExclamationCircleIcon className="ml-1 inline h-3 w-3 text-red-400" title="Required" />}
                    <div className="flex items-start mt-1">
                        <span className="text-gray-500 select-none ml-4 mr-2">|</span>
                        <span className="text-gray-400" style={{ wordBreak: 'break-word' }}>
                            [{shown.join(', ')}{hasMore ? `, +${value.values.length - maxEnum} more` : ''}]
                        </span>
                    </div>
                </li>
            );
        }
        return (
            <li key={key} className="truncate">
                <strong className="text-cyan-300">{key}:</strong>
                <span className="text-gray-300"> {value.type}</span>
                {value.isKey && <KeyIcon className="ml-1 inline h-3 w-3 text-yellow-400" title="Primary Key" />}
                {value.required && <ExclamationCircleIcon className="ml-1 inline h-3 w-3 text-red-400" title="Required" />}
                {value.default && <span className="text-gray-400 ml-2">Default: {value.default}</span>}
                {isObjectOrArray && properties && (
                    <ul className="ml-4 border-l border-gray-600 pl-2">
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
                <h3
                    className="text-lg font-bold text-cyan-400 cursor-move"
                    {...(dragHandleprops || {})}
                    title="Drag to reorder"
                >
                    {entity.name}
                </h3>
                <button
                    onClick={handleEditClick}
                    className="w-7 h-7 flex items-center justify-center bg-blue-600 rounded shadow hover:bg-blue-700 transition"
                    title="Edit"
                    style={{ minWidth: 0, minHeight: 0, padding: 0 }}
                >   
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="text-white">
                        <path d="M4 13.5V16h2.5l7.06-7.06-2.5-2.5L4 13.5z" fill="currentColor" />
                        <path d="M14.85 6.15a1 1 0 0 0 0-1.41l-1.59-1.59a1 1 0 0 0-1.41 0l-1.13 1.13 2.5 2.5 1.13-1.13z" fill="currentColor" />
                    </svg>
                </button>
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