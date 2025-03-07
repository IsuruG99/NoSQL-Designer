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

    useEffect(() => {
        setEntityName(tempSelectedEntity?.Name || "");
        setAttributes(tempSelectedEntity?.Attributes || {});
        setTempAttributes(tempSelectedEntity?.Attributes || {});
        setTempKeys(Object.keys(tempSelectedEntity?.Attributes || {}));
    }, [tempSelectedEntity]);

    const handleNameChange = (e) => {
        console.log(`handleNameChange was called, value: ${e.target.value}`);
        setEntityName(e.target.value);
        setTempSelectedEntity({ ...tempSelectedEntity, Name: e.target.value });
    };

    const updateAttributes = (updatedAttributes) => {
        setTempAttributes(updatedAttributes);
        setTempSelectedEntity({ ...tempSelectedEntity, Attributes: updatedAttributes });
    };

    const handleAttributeChange = (keyPath, value) => {
        console.log(`handleAttributeChange was called, keyPath: ${keyPath}, value: ${value}`);
        const updatedAttributes = { ...tempAttributes };

        if (typeof value === 'object' && value !== null) {
            updatedAttributes[keyPath] = value;
        } else {
            if (!updatedAttributes[keyPath]) {
                updatedAttributes[keyPath] = { type: value, properties: {} };
            } else {
                updatedAttributes[keyPath].type = value;
            }
        }

        updateAttributes(updatedAttributes);
    };

    const handleSubAttributeChange = (keyPath, subKey, value) => {
        console.log(`handleSubAttributeChange was called, keyPath: ${keyPath}, subKey: ${subKey}, value: ${value}`);
        const updatedAttributes = { ...tempAttributes };

        if (!updatedAttributes[keyPath].properties) {
            updatedAttributes[keyPath].properties = {};
        }

        if (typeof value === 'object' && value !== null) {
            updatedAttributes[keyPath].properties[subKey] = value;
        } else {
            if (!updatedAttributes[keyPath].properties[subKey]) {
                updatedAttributes[keyPath].properties[subKey] = { type: value, properties: {} };
            } else {
                updatedAttributes[keyPath].properties[subKey].type = value;
            }
        }

        updateAttributes(updatedAttributes);
    };

    const handleSubKeyChange = (keyPath, oldKey, newKey) => {
        console.log(`handleSubKeyChange was called, keyPath: ${keyPath}, oldKey: ${oldKey}, newKey: ${newKey}`);
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
        console.log(`handleDelete was called, key: ${key}`);
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

            const updatedSchema = { ...schema };

            if (updatedSchema.hasOwnProperty(originalSelectedEntity.Name)) {
                delete updatedSchema[originalSelectedEntity.Name];
            } else {
                throw new Error("Original selected entity not found in schema.");
            }

            updatedSchema[tempSelectedEntity.Name] = tempSelectedEntity;
            console.log("Updated schema's Name: ", updatedSchema[tempSelectedEntity.Name].Name);
            console.log("Updated schema's Attributes: ", updatedSchema[tempSelectedEntity.Name].Attributes);
            console.log("tempSelectedEntity: ", tempSelectedEntity);

            setSchema(updatedSchema);
            setOriginalSelectedEntity(null);
            setTempSelectedEntity(null);
            setSelectedEntity(null);
            handleCloseModal();
        } catch (error) {
            console.error("Failed to save changes:", error);
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
            <ul className="">
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
            </ul>
            <hr className="border-gray-600 my-4" />
            <div className="flex justify-end space-x-2">
                <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-green-800 text-white rounded hover:bg-green-700"
                >
                    Save
                </button>
                <button
                    onClick={handleCloseModal}
                    className="px-4 py-2 bg-red-800 text-white rounded hover:bg-red-700"
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

    const handleSubAttributeChange = (subKey, value) => {
        console.log(`AtrEditor's subAttributeChange was called, subKey: ${subKey}, value: ${value}`);
        const updatedProperties = { ...localAttributeValue.properties };

        if (typeof value === 'object' && value !== null) {
            updatedProperties[subKey] = value;
        } else {
            if (!updatedProperties[subKey]) {
                updatedProperties[subKey] = { type: value, properties: {} };
            } else {
                updatedProperties[subKey].type = value;
            }
        }

        setLocalAttributeValue({ ...localAttributeValue, properties: updatedProperties });
        onSubAttributeChange(attributeKey, subKey, value);
    };

    const handleSubKeyChange = (oldKey, newKey) => {
        console.log(`AtrEditor's subKeyChange was called, oldKey: ${oldKey}, newKey: ${newKey}`);
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
        console.log(`AtrEditor's keyNameChange was called, value: ${e.target.value}`);
        setKeyName(e.target.value);
    };

    const handleTypeChange = (e) => {
        console.log(`AtrEditor's typeChange was called, value: ${e.target.value}`);
        setLocalAttributeValue({ ...localAttributeValue, type: e.target.value });
    };

    const handleDelete = () => {
        console.log(`AtrEditor's handleDelete was called, attributeKey: ${attributeKey}`);
        onDelete(attributeKey);
    };

    const handleAdd = () => {
        // to be used way later, do not implement this. not related to current functions
    };

    const handleSave = () => {
        console.log(`attribute key new ${keyName} and ${attributeKey}`);
        if (keyName !== attributeKey) {
            onKeyChange(attributeKey, keyName);
        } else {
            onAttributeChange(keyName, localAttributeValue);
        }
    };

    return (
        <li className="truncate ml-4 hover:bg-gray-700 p-1 rounded">
            <input
                type="text"
                value={keyName}
                onChange={handleKeyNameChange}
                className="bg-transparent text-white mr-2"
            />
            <select
                value={localAttributeValue.type}
                onChange={handleTypeChange}
                className="ml-2 bg-gray-700 text-white rounded"
            >
                {dataTypes.map((type) => (
                    <option key={type} value={type}>
                        {type}
                    </option>
                ))}
            </select>
            <div className="flex justify-end items-center space-x-2">
                <button onClick={handleDelete} className="px-2 py-1 bg-red-800 text-white rounded hover:bg-red-700">Del</button>
                <button onClick={handleAdd} className="px-2 py-1 bg-blue-800 text-white rounded hover:bg-blue-700">Add</button>
                <button onClick={handleSave} className="px-2 py-1 bg-green-800 text-white rounded hover:bg-green-700">Save</button>
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