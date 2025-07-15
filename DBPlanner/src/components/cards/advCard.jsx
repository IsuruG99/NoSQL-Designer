import React, { useContext } from 'react';
import { SchemaContext } from '../../context/SchemaContext';
import { KeyIcon, ExclamationCircleIcon,  PencilIcon } from '@heroicons/react/24/solid';
import '../../css/customScrollbar.css';

/**
 * AdvCard - displays an entity card with attributes and edit option.
 * Supports nested object/array attributes and drag handle for reordering.
 * 
 * @param entity - the entity object with name, description, attributes
 * @param onEdit - callback to trigger edit modal
 * @param dragHandleprops - props for drag handle (optional) (react-dnd)
 */
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
        <div className="json-card p-4 bg-gray-800 text-white rounded-lg shadow-lg w-[220px] h-[300px] overflow-y-auto border border-gray-700 custom-scrollbar">
            <div className="flex justify-between items-center mb-2">
                <h3
                    className="text-lg font-bold text-cyan-400 cursor-move"
                    {...(dragHandleprops || {})}
                    title="Drag to reorder">
                    {entity.name}
                </h3>
                <button
                    onClick={handleEditClick}
                    className="w-7 h-7 flex items-center justify-center bg-blue-600 rounded shadow hover:bg-blue-700 transition"
                    title="Edit"
                    style={{ minWidth: 0, minHeight: 0, padding: 0 }}>
                    <PencilIcon className="h-4 w-4 text-white" />
                </button>
            </div>

            <hr className="border-gray-600 mb-2" />
            {entity.description && (
                <p className="text-gray-400 text-sm mb-2">{entity.description}</p>
            )}
            <ul className="text-sm space-y-1">
                {Object.entries(entity.attributes).map(([key, value]) => renderAttribute(key, value))}
            </ul>
        </div>
    );
}

export default AdvCard;