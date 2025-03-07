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
        console.log(`recieved name: ${e.target.value}`);
        setEntityName(e.target.value);
        setTempSelectedEntity({ ...tempSelectedEntity, Name: e.target.value });
    };

    const handleAttributeChange = (keyPath, value) => {
        const updatedAttributes = { ...tempAttributes };

        if ((typeof value === 'object' || typeof value === "array") && value !== null) {
            updatedAttributes[keyPath] = value;
        } else {
            updatedAttributes[keyPath].type = value;
        }

        setTempAttributes(updatedAttributes);
        setTempSelectedEntity({ ...tempSelectedEntity, Attributes: updatedAttributes });
    };

    const handleSave = () => {
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
            <ul className="space-y-2">
                {tempKeys.map((key) => (
                    <AttributeEditor
                        key={key}
                        attributeKey={key}
                        attributeValue={tempAttributes[key]}
                        onAttributeChange={handleAttributeChange}
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

function AttributeEditor({ attributeKey, attributeValue, onAttributeChange }) {
    const handleSubAttributeChange = (subKey, value) => {
        const updatedProperties = { ...attributeValue.properties };
        updatedProperties[subKey].type = value;
        onAttributeChange(attributeKey, { ...attributeValue, properties: updatedProperties });
    };

    return (
        <li className="truncate ml-4 hover:bg-gray-700 p-1 rounded">
            <span className="text-white">{attributeKey}</span>
            <select
                value={attributeValue.type}
                onChange={(e) => {
                    console.log(`Changing attribute ${attributeKey} to type ${e.target.value}`);
                    onAttributeChange(attributeKey, e.target.value);
                }}
                className="ml-2 bg-gray-700 text-white rounded"
            >
                {dataTypes.map((type) => (
                    <option key={type} value={type}>
                        {type}
                    </option>
                ))}
            </select>

            {attributeValue.properties && Object.keys(attributeValue.properties).length > 0 && (
                <ul className="ml-4 mt-2 space-y-1">
                    {Object.keys(attributeValue.properties).map((subKey) => (
                        <AttributeEditor
                            key={subKey}
                            attributeKey={subKey}
                            attributeValue={attributeValue.properties[subKey]}
                            onAttributeChange={(key, value) => handleSubAttributeChange(key, value)}
                        />
                    ))}
                </ul>
            )}
        </li>
    );
}

export default EditableCard;