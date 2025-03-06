import React, { useContext, useState, useEffect } from 'react';
import { SchemaContext } from '../SchemaContext';
import './customScrollbar.css'; // Import the custom scrollbar CSS

const dataTypes = [
    "string",
    "number",
    "boolean",
    "timestamp",
    "array",
    "object",
    "null",
    "binary",
    "map"
];

function EditableCard({ handleCloseModal }) {
    const { schema, setSchema, tempSelectedEntity, setTempSelectedEntity, originalSelectedEntity, setOriginalSelectedEntity, setSelectedEntity } = useContext(SchemaContext);
    const [entityName, setEntityName] = useState(tempSelectedEntity?.Name || "");
    const [attributes, setAttributes] = useState(tempSelectedEntity?.Attributes || {});
    const [tempAttributes, setTempAttributes] = useState(attributes);
    const [tempKeys, setTempKeys] = useState(Object.keys(tempAttributes));
    const [editingKey, setEditingKey] = useState(null);
    const [tempEditingKey, setTempEditingKey] = useState("");

    useEffect(() => {
        setEntityName(tempSelectedEntity?.Name || "");
        setAttributes(tempSelectedEntity?.Attributes || {});
        setTempAttributes(tempSelectedEntity?.Attributes || {});
        setTempKeys(Object.keys(tempSelectedEntity?.Attributes || {}));
    }, [tempSelectedEntity]);

    const handleNameChange = (e) => {
        const newName = e.target.value;
        if (newName.trim() !== "" && !/^\d/.test(newName)) {
            setEntityName(newName);
            setTempSelectedEntity({ ...tempSelectedEntity, Name: newName });
        }
    };

    const handleAttributeChange = (keyPath, value) => {
        const keys = keyPath.split('.');
        const updatedAttributes = { ...tempAttributes };
        let nestedAttributes = updatedAttributes;
    
        keys.slice(0, -1).forEach(k => {
            if (!nestedAttributes[k].properties) {
                nestedAttributes[k].properties = {};
            }
            nestedAttributes = nestedAttributes[k].properties;
        });
    
        nestedAttributes[keys[keys.length - 1]] = value;
        setTempAttributes(updatedAttributes);
        setTempSelectedEntity({ ...tempSelectedEntity, Attributes: updatedAttributes });
    };

    const handleAddAttribute = () => {
        const newKey = `NewAttribute${Object.keys(tempAttributes).length + 1}`;
        const updatedAttributes = { ...tempAttributes, [newKey]: "string" };
        setTempAttributes(updatedAttributes);
        setTempKeys([...tempKeys, newKey]);
        setTempSelectedEntity({ ...tempSelectedEntity, Attributes: updatedAttributes });
    };

    const handleKeyChange = (keyPath, newKey) => {
        if (newKey.trim() !== "" && !/^\d/.test(newKey)) {
            const keys = keyPath.split('.');
            const lastKey = keys.pop();
            let nestedAttributes = tempAttributes;
    
            keys.forEach(k => {
                if (!nestedAttributes[k].properties) {
                    nestedAttributes[k].properties = {};
                }
                nestedAttributes = nestedAttributes[k].properties;
            });

            if (nestedAttributes.hasOwnProperty(newKey)) {
                alert("An attribute with this name already exists.");
                return;
            }
    
            const value = nestedAttributes[lastKey];
            delete nestedAttributes[lastKey];
            nestedAttributes[newKey] = value;
    
            setTempAttributes({ ...tempAttributes });
            setTempSelectedEntity({ ...tempSelectedEntity, Attributes: tempAttributes });
        }
    };

    const handleSave = () => {
        try {
            // Ensure all session variables are intact
            if (!schema || !tempSelectedEntity || !originalSelectedEntity) {
                throw new Error("Session variables are missing.");
            }
    
            // Ensure schema is an object
            if (typeof schema !== 'object' || Array.isArray(schema)) {
                throw new Error("Schema is not an object.");
            }
    
            // Create a copy of the schema
            const updatedSchema = { ...schema };
    
            // Remove the original selected entity from the schema
            if (updatedSchema.hasOwnProperty(originalSelectedEntity.Name)) {
                delete updatedSchema[originalSelectedEntity.Name];
            } else {
                throw new Error("Original selected entity not found in schema.");
            }
    
            // Append the temp selected entity to the schema
            updatedSchema[tempSelectedEntity.Name] = tempSelectedEntity;
    
            // Update the schema state
            setSchema(updatedSchema);
    
            // Clear original and temp selected entities
            setOriginalSelectedEntity(null);
            setTempSelectedEntity(null);
            setSelectedEntity(null);
    
            // Close the modal
            handleCloseModal();
        } catch (error) {
            console.error("Failed to save changes:", error);
            alert(error.message);
        }
    };

    const renderAttributeEditor = (key, value, keyPath = key) => {
        if (typeof value === 'object' && value !== null) {
            if (value.type === 'object') {
                return (
                    <li key={keyPath} className="truncate">
                        <strong className="text-cyan-300">{key}:</strong>
                        <ul className="ml-4">
                            {Object.entries(value.properties).map(([subKey, subValue]) => (
                                renderAttributeEditor(subKey, subValue, `${keyPath}.${subKey}`)
                            ))}
                        </ul>
                    </li>
                );
            } else if (value.type === 'array') {
                return (
                    <li key={keyPath} className="truncate">
                        <strong className="text-cyan-300">{key}:</strong>
                        <ul className="ml-4">
                            {Object.entries(value.items.properties).map(([subKey, subValue]) => (
                                renderAttributeEditor(subKey, subValue, `${keyPath}.${subKey}`)
                            ))}
                        </ul>
                    </li>
                );
            }
        } else {
            return (
                <AttributeEditor
                    key={keyPath}
                    attributeKey={key}
                    attributeValue={value}
                    keyPath={keyPath}
                    editingKey={editingKey}
                    tempEditingKey={tempEditingKey}
                    setEditingKey={setEditingKey}
                    setTempEditingKey={setTempEditingKey}
                    handleKeyChange={handleKeyChange}
                    handleAttributeChange={handleAttributeChange}
                />
            );
        }
    };

    return (
        <div className="json-card p-4 bg-gray-800 text-white rounded-lg shadow-lg w-full min-w-[200px] min-h-[500px] h-full border border-gray-700 flex flex-col justify-between custom-scrollbar">
            <div>
                <input
                    type="text"
                    value={entityName}
                    onChange={handleNameChange}
                    className="text-lg font-bold mb-2 text-cyan-400 bg-transparent border-none focus:outline-none"
                />
                <hr className="border-gray-600 mb-2" />
                <ul className="text-sm space-y-1">
                    {tempKeys.map((key) => (
                        renderAttributeEditor(key, tempAttributes[key])
                    ))}
                </ul>
                <li className="truncate flex items-center justify-between hover:bg-gray-700 rounded p-1 m-1">
                    <button
                        onClick={handleAddAttribute}
                        className="text-cyan-400 bg-transparent border-none focus:outline-none hover:text-cyan-600"
                    >
                        + Add Attribute
                    </button>
                </li>
            </div>
            <div>
                <hr className="border-gray-600 my-2" />
                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        className="mt-2 ml-2 px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}

function AttributeEditor({
    attributeKey,
    attributeValue,
    keyPath,
    editingKey,
    tempEditingKey,
    setEditingKey,
    setTempEditingKey,
    handleKeyChange,
    handleAttributeChange
}) {
    return (
        <li className="truncate flex items-center justify-between hover:bg-gray-700 p-1 rounded">
            <input
                type="text"
                value={editingKey === keyPath ? tempEditingKey : attributeKey}
                onChange={(e) => {
                    const newKey = e.target.value;
                    setTempEditingKey(newKey);
                    setEditingKey(keyPath);
                }}
                onBlur={() => {
                    if (editingKey === keyPath) {
                        handleKeyChange(keyPath, tempEditingKey);
                        setEditingKey(null);
                        setTempEditingKey("");
                    }
                }}
                className="text-cyan-300 bg-transparent border-none focus:outline-none mr-2 flex-grow"
            />
            <div className="flex-shrink-0">
                <select
                    value={attributeValue}
                    onChange={(e) => handleAttributeChange(keyPath, e.target.value)}
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