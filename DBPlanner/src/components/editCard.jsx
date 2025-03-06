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
    
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!nestedAttributes[key]) {
                nestedAttributes[key] = { type: 'object', properties: {} };
            }
            nestedAttributes = nestedAttributes[key].properties;
        }
    
        const lastKey = keys[keys.length - 1];
        nestedAttributes[lastKey] = value;
    
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

    const handleAddSubAttribute = (keyPath) => {
        pass; //we will not bother with this, it is not handled and will not be looked at for near future.
    };

    const handleKeyChange = (keyPath, newKey) => {
        if (newKey.trim() !== "" && !/^\d/.test(newKey)) {
            const keys = keyPath.split('.');
            const lastKey = keys.pop();
            let nestedAttributes = tempAttributes;
    
            keys.forEach(k => {
                if (!nestedAttributes[k]) {
                    nestedAttributes[k] = { properties: {} };
                } else if (!nestedAttributes[k].properties) {
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
            setTempSelectedEntity({ ...tempSelectedEntity, Attributes: { ...tempAttributes } });
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
        console.log("Rendering attribute editor for:", key, value, keyPath);
        if (typeof value === 'object' && value !== null) {
            if (value.type === 'object' && value.properties) {
                return (
                    <li key={keyPath} className="truncate">
                        <div className="flex items-center">
                            <input
                                type="text"
                                value={editingKey === keyPath ? tempEditingKey : key}
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
                                className="text-cyan-300 bg-transparent border-none focus:outline-none mr-2"
                            />
                            <span className="text-cyan-300 mr-2">:</span>
                            <span className="text-gray-300">object</span>
                        </div>
                        <ul className="ml-4">
                            {Object.entries(value.properties).map(([subKey, subValue]) => 
                                renderAttributeEditor(subKey, subValue, `${keyPath}.properties.${subKey}`)
                            )}
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
                    handleAddSubAttribute={handleAddSubAttribute}
                />
            );
        }
    };

    return (
        <div>
            <h2>Edit Entity: {entityName}</h2>
            <input
                type="text"
                value={entityName}
                onChange={handleNameChange}
                className="text-cyan-300 bg-transparent border-none focus:outline-none mr-2"
            />
            <ul>
                {tempKeys.map((key) => renderAttributeEditor(key, tempAttributes[key]))}
            </ul>
            <button onClick={handleAddAttribute}>Add Attribute</button>
            <button onClick={handleSave}>Save</button>
            <button onClick={handleCloseModal}>Cancel</button>
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
    handleAttributeChange,
    handleAddSubAttribute // Add this prop
}) {
    const isFirstLevel = keyPath.split('.').length === 1;
    const isObjectType = attributeValue && attributeValue.type === 'object';

    return (
        <li className="truncate flex items-center justify-between hover:bg-gray-700 p-1 rounded relative">
            <div className="flex items-center flex-grow">
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
                    className="text-cyan-300 bg-transparent border-none focus:outline-none mr-2"
                />
                <span className="text-cyan-300 mr-2">:</span>
                <select
                    value={attributeValue?.type || attributeValue}
                    onChange={(e) => handleAttributeChange(keyPath, e.target.value)}
                    className="text-gray-300 bg-gray-700 border border-gray-600 rounded focus:outline-none"
                >
                    {dataTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </select>
            </div>
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                {isFirstLevel && isObjectType && (
                    <button
                        className="text-white-500 text-sm hover:text-blue-500"
                        onClick={() => handleAddSubAttribute(keyPath)}
                    >
                        Sub
                    </button>
                )}
                <button
                    className="text-white-500 text-xl hover:text-red-700"
                    onClick={() => { /* handleDeleteAttribute(keyPath) */ }}
                >
                    X
                </button>
            </div>
        </li>
    );
}

export default EditableCard;