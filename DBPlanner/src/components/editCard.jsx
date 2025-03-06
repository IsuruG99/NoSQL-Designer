import React, { useContext, useState } from 'react';
import { SchemaContext } from '../SchemaContext';

const dataTypes = ["string", "number", "boolean", "timestamp", "array"];

function EditableCard() {
    const { selectedEntity, setSelectedEntity } = useContext(SchemaContext);
    const [entityName, setEntityName] = useState(selectedEntity?.Name || "");
    const [attributes, setAttributes] = useState(selectedEntity?.Attributes || {});
    const [tempAttributes, setTempAttributes] = useState(attributes);
    const [tempKeys, setTempKeys] = useState(Object.keys(tempAttributes));
    const [editingKey, setEditingKey] = useState(null);
    const [tempEditingKey, setTempEditingKey] = useState("");

    const handleNameChange = (e) => {
        const newName = e.target.value;
        if (newName.trim() !== "" && !/^\d/.test(newName)) {
            setEntityName(newName);
            setSelectedEntity({ ...selectedEntity, Name: newName });
        }
    };

    const handleAttributeChange = (key, value) => {
        const updatedAttributes = { ...tempAttributes, [key]: value };
        setTempAttributes(updatedAttributes);
    };

    const handleAddAttribute = () => {
        const newKey = `NewAttribute${Object.keys(tempAttributes).length + 1}`;
        const updatedAttributes = { ...tempAttributes, [newKey]: "string" };
        setTempAttributes(updatedAttributes);
        setTempKeys([...tempKeys, newKey]);
    };

    const handleSave = () => {
        setAttributes(tempAttributes);
        setSelectedEntity({ ...selectedEntity, Attributes: tempAttributes });
    };

    const handleKeyChange = (key, newKey) => {
        if (newKey.trim() !== "" && !/^\d/.test(newKey) && !tempKeys.includes(newKey)) {
            const updatedAttributes = { ...tempAttributes, [newKey]: tempAttributes[key] };
            delete updatedAttributes[key];
            setTempAttributes(updatedAttributes);
            setTempKeys(tempKeys.map(k => k === key ? newKey : k));
        }
    };

    return (
        <div className="json-card p-4 bg-gray-800 text-white rounded-lg shadow-lg min-w-[220px] h-full border border-gray-700">
            <input
                type="text"
                value={entityName}
                onChange={handleNameChange}
                className="text-lg font-bold mb-2 text-cyan-400 bg-transparent border-none focus:outline-none"
            />
            <hr className="border-gray-600 mb-2" />
            <ul className="text-sm space-y-1">
                {tempKeys.map((key) => (
                    <AttributeEditor
                        key={key}
                        attributeKey={key}
                        attributeValue={tempAttributes[key]}
                        editingKey={editingKey}
                        tempEditingKey={tempEditingKey}
                        setEditingKey={setEditingKey}
                        setTempEditingKey={setTempEditingKey}
                        handleKeyChange={handleKeyChange}
                        handleAttributeChange={handleAttributeChange}
                    />
                ))}
            </ul>
            <button
                onClick={handleAddAttribute}
                className="mt-2 px-2 py-1 bg-cyan-600 text-white rounded hover:bg-cyan-700"
            >
                Add Attribute
            </button>
            <button
                onClick={handleSave}
                className="mt-2 ml-2 px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
            >
                Save (Does not work)
            </button>
        </div>
    );
}

function AttributeEditor({
    attributeKey,
    attributeValue,
    editingKey,
    tempEditingKey,
    setEditingKey,
    setTempEditingKey,
    handleKeyChange,
    handleAttributeChange
}) {
    return (
        <li className="truncate flex items-center justify-between">
            <input
                type="text"
                value={editingKey === attributeKey ? tempEditingKey : attributeKey}
                onChange={(e) => {
                    const newKey = e.target.value;
                    setTempEditingKey(newKey);
                    setEditingKey(attributeKey);
                }}
                onBlur={() => {
                    handleKeyChange(attributeKey, tempEditingKey);
                    setEditingKey(null);
                    setTempEditingKey("");
                }}
                className="text-cyan-300 bg-transparent border-none focus:outline-none mr-2 flex-grow"
            />
            <div className="flex-shrink-0">
                <select
                    value={attributeValue}
                    onChange={(e) => handleAttributeChange(attributeKey, e.target.value)}
                    className="text-gray-300 bg-gray-700 border border-gray-600 rounded focus:outline-none"
                >
                    {dataTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </select>
            </div>
        </li>
    );
}

export default EditableCard;