import React, { useContext, useState, useEffect } from 'react';
import { SchemaContext } from '../SchemaContext';
import './customScrollbar.css';

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

function EditableCard({ handleCloseModal, isNewCard = false }) {
    const { schema, setSchema, tempSelectedEntity, setTempSelectedEntity, originalSelectedEntity, setOriginalSelectedEntity, setSelectedEntity } = useContext(SchemaContext);
    const [entityName, setEntityName] = useState(isNewCard ? "" : tempSelectedEntity?.Name || "");
    const [attributes, setAttributes] = useState(isNewCard ? {} : tempSelectedEntity?.Attributes || {});
    const [tempAttributes, setTempAttributes] = useState(attributes);
    const [tempKeys, setTempKeys] = useState(Object.keys(tempAttributes));

    useEffect(() => {
        if (!isNewCard) {
            setEntityName(tempSelectedEntity?.Name || "");
            setAttributes(tempSelectedEntity?.Attributes || {});
            setTempAttributes(tempSelectedEntity?.Attributes || {});
            setTempKeys(Object.keys(tempSelectedEntity?.Attributes || {}));
        }
    }, [tempSelectedEntity, isNewCard]);

    const handleNameChange = (e) => {
        setEntityName(e.target.value);
        setTempSelectedEntity({ ...tempSelectedEntity, Name: e.target.value });
    };

    const updateAttributes = (updatedAttributes) => {
        setTempAttributes(updatedAttributes);
        setTempSelectedEntity({ ...tempSelectedEntity, Attributes: updatedAttributes });
    };

    const handleAttributeChange = (keyPath, value) => {
        const updatedAttributes = { ...tempAttributes };

        if (typeof value === 'object' && value !== null) {
            updatedAttributes[keyPath] = value;
        } else {
            if (!updatedAttributes[keyPath]) {
                updatedAttributes[keyPath] = { type: value || "string", properties: {} };
            } else {
                updatedAttributes[keyPath].type = value || "string";
            }
        }

        updateAttributes(updatedAttributes);
    };

    const handleSubAttributeChange = (keyPath, subKey, value) => {
        const updatedAttributes = { ...tempAttributes };

        if (!updatedAttributes[keyPath].properties) {
            updatedAttributes[keyPath].properties = {};
        }

        if (typeof value === 'object' && value !== null) {
            updatedAttributes[keyPath].properties[subKey] = value;
        } else {
            if (!updatedAttributes[keyPath].properties[subKey]) {
                updatedAttributes[keyPath].properties[subKey] = { type: value || "string", properties: {} };
            } else {
                updatedAttributes[keyPath].properties[subKey].type = value || "string";
            }
        }

        updateAttributes(updatedAttributes);
    };

    const handleSubKeyChange = (keyPath, oldKey, newKey) => {
        const updatedAttributes = { ...tempAttributes };

        if (updatedAttributes[keyPath].properties.hasOwnProperty(newKey) && oldKey !== newKey) {
            alert(`The key "${newKey}" already exists. Please choose a different key.`);
            return;
        }

        if (updatedAttributes[keyPath].properties.hasOwnProperty(oldKey)) {
            updatedAttributes[keyPath].properties[newKey] = updatedAttributes[keyPath].properties[oldKey];
            delete updatedAttributes[keyPath].properties[oldKey];
        }

        updateAttributes(updatedAttributes);
    };

    const handleKeyChange = (oldKey, newKey) => {
        const updatedAttributes = { ...tempAttributes };

        if (updatedAttributes.hasOwnProperty(newKey) && oldKey !== newKey) {
            alert(`The key "${newKey}" already exists. Please choose a different key.`);
            return;
        }

        if (updatedAttributes.hasOwnProperty(oldKey)) {
            updatedAttributes[newKey] = updatedAttributes[oldKey];
            delete updatedAttributes[oldKey];
        }

        setTempAttributes(updatedAttributes);
        setTempSelectedEntity({ ...tempSelectedEntity, Attributes: updatedAttributes });
        setTempKeys(Object.keys(updatedAttributes));
    };

    const handleDelete = (key) => {
        const updatedAttributes = { ...tempAttributes };
        delete updatedAttributes[key];

        setTempAttributes(updatedAttributes);
        setTempSelectedEntity({ ...tempSelectedEntity, Attributes: updatedAttributes });
        setTempKeys(Object.keys(updatedAttributes));
    };

    const handleSave = () => {
        console.log("handleSave was called");
        try {
            if (!schema || !tempSelectedEntity || !originalSelectedEntity) {
                throw new Error("Session variables are missing.");
            }

            if (typeof schema !== 'object') {
                throw new Error("Schema is not an object.");
            }

            if (!entityName.trim()) {
                throw new Error("Entity name cannot be blank.");
            }

            if (Object.keys(tempAttributes).length === 0) {
                throw new Error("Entity must have at least one attribute.");
            }

            const updatedSchema = { ...schema };

            if (!isNewCard && updatedSchema.hasOwnProperty(originalSelectedEntity.Name)) {
                delete updatedSchema[originalSelectedEntity.Name];
            } else if (!isNewCard) {
                throw new Error("Original selected entity not found in schema.");
            }

            updatedSchema[tempSelectedEntity.Name] = tempSelectedEntity;

            setSchema(updatedSchema);
            setOriginalSelectedEntity(null);
            setTempSelectedEntity(null);
            setSelectedEntity(null);
            handleCloseModal();
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <div className="w-full h-full p-4 bg-gray-800 rounded-lg shadow-lg">
            <input
                type="text"
                value={entityName}
                onChange={handleNameChange}
                className="text-xl font-bold bg-transparent mb-4 w-full"
            />
            <hr className="border-gray-600 mb-4" />
            <ul className="flex flex-col justify-center mx-auto">
                {tempKeys.map((key) => (
                    <AttributeEditor
                        key={key}
                        attributeKey={key}
                        attributeValue={tempAttributes[key]}
                        onAttributeChange={handleAttributeChange}
                        onSubAttributeChange={handleSubAttributeChange}
                        onKeyChange={handleKeyChange}
                        onSubKeyChange={handleSubKeyChange}
                        onDelete={handleDelete}
                    />
                ))}
                <button 
                    onClick={() => {
                        const newKey = `newAttribute${tempKeys.length + 1}`;
                        const updatedAttributes = { ...tempAttributes };
                        updatedAttributes[newKey] = { type: "string", properties: {} };
                        updateAttributes(updatedAttributes);
                    }}
                    className="text-white hover:text-cyan-400 text-xl mt-2 mx-5 flex items-center "
                >
                    Add Attribute
                </button>
            </ul>
            <hr className="border-gray-600 my-4" />
            <div className="flex justify-end space-x-2">
                <button
                    onClick={handleSave}
                    className="px-4 py-2 text-white rounded bg-green-600 hover:bg-green-700 border-green-800 border-b-3"
                >
                    Update
                </button>
                <button
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-white rounded bg-red-600 hover:bg-red-700 border-red-800 border-b-3"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}

function AttributeEditor({ attributeKey, attributeValue, onAttributeChange, onSubAttributeChange, onKeyChange, onSubKeyChange, onDelete }) {
    const [keyName, setKeyName] = useState(attributeKey);
    const [localAttributeValue, setLocalAttributeValue] = useState(attributeValue);

    // Check if this is a sub-attribute by looking for dots in the key
    const isSubAttribute = attributeKey.includes('.');

    const handleSubAttributeChange = (subKey, value) => {
        const updatedProperties = { ...localAttributeValue.properties };

        if (typeof value === 'object' && value !== null) {
            updatedProperties[subKey] = value;
        } else {
            if (!updatedProperties[subKey]) {
                updatedProperties[subKey] = { type: value || "string", properties: {} };
            } else {
                updatedProperties[subKey].type = value || "string";
            }
        }

        setLocalAttributeValue({ ...localAttributeValue, properties: updatedProperties });
        onSubAttributeChange(attributeKey, subKey, value);
    };

    const handleSubKeyChange = (oldKey, newKey) => {
        if (newKey === "type" || newKey === "properties") {
            alert("Cannot rename 'type' or 'properties'");
            return;
        }

        const updatedProperties = { ...localAttributeValue.properties };
        updatedProperties[newKey] = { ...updatedProperties[oldKey] };
        delete updatedProperties[oldKey];

        setLocalAttributeValue({ ...localAttributeValue, properties: updatedProperties });
        onSubKeyChange(attributeKey, oldKey, newKey);
    };

    const handleKeyNameChange = (e) => {
        setKeyName(e.target.value);
    };

    const handleTypeChange = (e) => {
        setLocalAttributeValue({ ...localAttributeValue, type: e.target.value });
    };

    const handleDelete = () => {
        onDelete(attributeKey);
    };

    const handleAddSubAttribute = () => {
        if (localAttributeValue.type === "object" || localAttributeValue.type === "array") {
            // For objects, we add directly to properties
            const newKey = `newSubAttribute${Object.keys(localAttributeValue.properties).length + 1}`;
            localAttributeValue.properties[newKey] = {
                type: "string",
                properties: {}
            };
        }

        setLocalAttributeValue({ ...localAttributeValue });
        onAttributeChange(attributeKey, localAttributeValue);
    };

    const handleSave = () => {
        if (keyName !== attributeKey) {
            onKeyChange(attributeKey, keyName);
        } else {
            onAttributeChange(keyName, localAttributeValue);
        }
    };

    return (
        <li className="truncate ml-4 hover:bg-gray-700 p-1 rounded group">
            <div className="flex items-center">
                <div className="flex items-center space-x-2 justify-center">
                    <input
                        type="text"
                        value={keyName}
                        onChange={handleKeyNameChange}
                        className="flex-grow text-white mr-2 bg-transparent"
                    />
                    <select
                        value={localAttributeValue.type}
                        onChange={handleTypeChange}
                        className="flex-grow ml-2 text-white rounded bg-gray-700 "
                    >
                        {dataTypes.map((type) => (
                            <option key={type} value={type}>
                                {type}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex space-x-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    
                    {(localAttributeValue.type === "array" || localAttributeValue.type === "object") && !isSubAttribute && (
                        <button onClick={handleAddSubAttribute} className="px-2 py-1 text-white rounded hover:text-cyan-400 text-xl">+</button>
                    )}
                    <button onClick={handleSave} className="px-2 py-1 text-white rounded hover:text-green-400">✓</button>
                    <button onClick={handleDelete} className="px-2 py-1 text-white rounded hover:text-red-400">✕</button>
                </div>
            </div>

            {localAttributeValue.properties && Object.keys(localAttributeValue.properties).length > 0 && (
                <ul className="ml-4 mt-2 space-y-1">
                    {Object.keys(localAttributeValue.properties).map((subKey) => (
                        <AttributeEditor
                            key={subKey}
                            attributeKey={subKey}
                            attributeValue={localAttributeValue.properties[subKey]}
                            onAttributeChange={(key, value) => handleSubAttributeChange(key, value)}
                            onKeyChange={(oldKey, newKey) => handleSubKeyChange(oldKey, newKey)}
                            onDelete={onDelete}
                        />
                    ))}
                </ul>
            )}
        </li>
    );
}

export default EditableCard;