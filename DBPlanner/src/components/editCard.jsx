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

const storageOptions = [
    "embedded",
    "normalized"
];

function EditableCard({ handleCloseModal, isNewCard = false }) {
    const { schema, setSchema, tempSelectedEntity, setTempSelectedEntity, originalSelectedEntity, setOriginalSelectedEntity, setSelectedEntity } = useContext(SchemaContext);
    const [entityName, setEntityName] = useState(isNewCard ? "" : tempSelectedEntity?.name || "");
    const [entityDescription, setEntityDescription] = useState(isNewCard ? "" : tempSelectedEntity?.description || "");
    const [attributes, setAttributes] = useState(isNewCard ? {} : tempSelectedEntity?.attributes || {});
    const [tempAttributes, setTempAttributes] = useState(attributes);
    const [tempKeys, setTempKeys] = useState(Object.keys(tempAttributes));

    useEffect(() => {
        if (!isNewCard) {
            setEntityName(tempSelectedEntity?.name || "");
            setEntityDescription(tempSelectedEntity?.description || "");
            setAttributes(tempSelectedEntity?.attributes || {});
            setTempAttributes(tempSelectedEntity?.attributes || {});
            setTempKeys(Object.keys(tempSelectedEntity?.attributes || {}));
        }
    }, [tempSelectedEntity, isNewCard]);

    const handleNameChange = (e) => {
        setEntityName(e.target.value);
        setTempSelectedEntity({ ...tempSelectedEntity, name: e.target.value });
    };

    const handleDescriptionChange = (e) => {
        setEntityDescription(e.target.value);
        setTempSelectedEntity({ ...tempSelectedEntity, description: e.target.value });
    };

    const updateAttributes = (updatedAttributes) => {
        setTempAttributes(updatedAttributes);
        setTempSelectedEntity({ ...tempSelectedEntity, attributes: updatedAttributes });
    };

    const handleAttributeChange = (keyPath, value) => {
        const updatedAttributes = { ...tempAttributes };

        if (typeof value === 'object' && value !== null) {
            updatedAttributes[keyPath] = value;
        } else {
            if (!updatedAttributes[keyPath]) {
                updatedAttributes[keyPath] = {
                    type: value || "string",
                    required: false,
                    validation: {},
                    storage: "embedded",
                    properties: {}
                };
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
                updatedAttributes[keyPath].properties[subKey] = {
                    type: value || "string",
                    required: false,
                    validation: {},
                    properties: {}
                };
            } else {
                updatedAttributes[keyPath].properties[subKey].type = value || "string";
            }
        }

        updateAttributes(updatedAttributes);
    };

    const handleRequiredChange = (keyPath, required) => {
        const updatedAttributes = { ...tempAttributes };
        updatedAttributes[keyPath].required = required;
        updateAttributes(updatedAttributes);
    };

    const handleStorageChange = (keyPath, storage) => {
        const updatedAttributes = { ...tempAttributes };
        updatedAttributes[keyPath].storage = storage;
        updateAttributes(updatedAttributes);
    };

    const handleValidationChange = (keyPath, validationKey, validationValue) => {
        const updatedAttributes = { ...tempAttributes };
        if (!updatedAttributes[keyPath].validation) {
            updatedAttributes[keyPath].validation = {};
        }
        updatedAttributes[keyPath].validation[validationKey] = validationValue;
        updateAttributes(updatedAttributes);
    };

    const handleSave = () => {
        try {
            if (!schema || !tempSelectedEntity) {
                throw new Error("Session variables are missing.");
            }

            if (typeof schema !== 'object') {
                throw new Error("Schema is not an object.");
            }

            if (!entityName.trim()) {
                throw new Error("Collection name cannot be blank.");
            }

            if (Object.keys(tempAttributes).length === 0) {
                throw new Error("Collection must have at least one attribute.");
            }

            const updatedSchema = { ...schema };

            if (!updatedSchema.collections) {
                updatedSchema.collections = {};
            }

            if (!isNewCard && originalSelectedEntity && updatedSchema.collections[originalSelectedEntity.name]) {
                delete updatedSchema.collections[originalSelectedEntity.name];
            }

            updatedSchema.collections[entityName] = {
                name: entityName,
                description: entityDescription,
                attributes: tempAttributes
            };

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
        <div className="w-full h-full flex flex-col bg-gray-800 rounded-lg shadow-lg">
            {/* Fixed Header Section */}
            <div className="p-4">
                <div className="mb-2">
                    <label className="block text-gray-400 text-sm mb-1">Collection Name</label>
                    <input
                        type="text"
                        value={entityName}
                        onChange={handleNameChange}
                        className="text-xl font-bold bg-gray-700 text-white p-1 rounded w-full"
                    />
                </div>

                <div className="mb-2">
                    <label className="block text-gray-400 text-sm mb-1">Description</label>
                    <input
                        type="text"
                        value={entityDescription}
                        onChange={handleDescriptionChange}
                        className="bg-gray-700 text-white p-1 rounded w-full"
                    />
                </div>
            </div>

            <hr className="border-gray-600" />

            {/* Scrollable Content Section */}
            <div className="flex-1 overflow-y-auto custom-scrollbar max-h-[50vh] p-4">
                <h3 className="text-lg font-bold text-cyan-400 mb-2">Attributes</h3>

                <ul className="space-y-2">
                    {tempKeys.map((key) => (
                        <AttributeEditor
                            key={key}
                            attributeKey={key}
                            attributeValue={tempAttributes[key]}
                            onAttributeChange={handleAttributeChange}
                            onSubAttributeChange={handleSubAttributeChange}
                            onRequiredChange={handleRequiredChange}
                            onStorageChange={handleStorageChange}
                            onValidationChange={handleValidationChange}
                            isNested={false}
                        />
                    ))}
                </ul>

                <button
                    onClick={() => {
                        const newKey = `newAttribute${tempKeys.length + 1}`;
                        const updatedAttributes = { ...tempAttributes };
                        updatedAttributes[newKey] = {
                            type: "string",
                            required: false,
                            validation: {},
                            storage: "embedded",
                            properties: {}
                        };
                        updateAttributes(updatedAttributes);
                    }}
                    className="text-white hover:text-cyan-400 text-xl mt-4 flex items-center w-full justify-center py-2 border border-dashed border-gray-600 rounded-lg"
                >
                    + Add Attribute
                </button>
            </div>

            <hr className="border-gray-600" />

            {/* Fixed Footer Section */}
            <div className="p-4 flex justify-end space-x-2">
                <button
                    onClick={handleSave}
                    className="px-4 py-2 text-white rounded bg-green-600 hover:bg-green-700 border-green-800 border-b-3"
                >
                    {isNewCard ? 'Create' : 'Update'}
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

function AttributeEditor({
    attributeKey,
    attributeValue,
    onAttributeChange,
    onSubAttributeChange,
    onRequiredChange,
    onStorageChange,
    onValidationChange,
    isNested
}) {
    const [keyName, setKeyName] = useState(attributeKey);
    const [localAttributeValue, setLocalAttributeValue] = useState(attributeValue);
    const [validationKey, setValidationKey] = useState("");
    const [validationValue, setValidationValue] = useState("");
    const [isExpanded, setIsExpanded] = useState(false);
    

    const handleTypeChange = (e) => {
        const newType = e.target.value;
        let newValue = { ...localAttributeValue, type: newType };

        if ((localAttributeValue.type === 'object' || localAttributeValue.type === 'array') &&
            newType !== 'object' && newType !== 'array') {
            newValue = { ...newValue, properties: {} };
        }

        if ((newType === 'object' || newType === 'array') && !newValue.properties) {
            newValue = { ...newValue, properties: {} };
        }

        setLocalAttributeValue(newValue);
        onAttributeChange(attributeKey, newValue);
    };

    const handleRequiredChange = (e) => {
        const newValue = { ...localAttributeValue, required: e.target.checked };
        setLocalAttributeValue(newValue);
        onRequiredChange(attributeKey, e.target.checked);
    };

    const handleStorageChange = (e) => {
        const newValue = { ...localAttributeValue, storage: e.target.value };
        setLocalAttributeValue(newValue);
        onStorageChange(attributeKey, e.target.value);
    };

    const handleValidationAdd = () => {
        if (validationKey && validationValue) {
            const newValidation = { ...localAttributeValue.validation, [validationKey]: validationValue };
            const newValue = { ...localAttributeValue, validation: newValidation };
            setLocalAttributeValue(newValue);
            onValidationChange(attributeKey, validationKey, validationValue);
            setValidationKey("");
            setValidationValue("");
        }
    };

    const handleValidationRemove = (key) => {
        const newValidation = { ...localAttributeValue.validation };
        delete newValidation[key];
        const newValue = { ...localAttributeValue, validation: newValidation };
        setLocalAttributeValue(newValue);
        onValidationChange(attributeKey, key, undefined);
    };

    const handleAddSubAttribute = () => {
        if (localAttributeValue.type === "object" || localAttributeValue.type === "array") {
            const newKey = `newSubAttribute${Object.keys(localAttributeValue.properties || {}).length + 1}`;
            const newProperties = {
                ...localAttributeValue.properties,
                [newKey]: {
                    type: "string",
                    required: false,
                    validation: {},
                    properties: {}
                }
            };
            const newValue = { ...localAttributeValue, properties: newProperties };
            setLocalAttributeValue(newValue);
            onAttributeChange(attributeKey, newValue);
        }
    };

    const getAvailableTypes = () => {
        if (isNested) {
            return dataTypes.filter(type => type !== 'object' && type !== 'array');
        }
        return dataTypes;
    };

    return (
        <li className="bg-gray-700 rounded-lg p-3">
            {/* Compact view - always visible and clickable */}
            <div
                className="flex justify-between items-center cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="font-medium text-white">{keyName || "Unnamed attribute"}</div>
                <div className="flex items-center">
                    <div className="text-sm text-gray-400 mr-2">
                        {localAttributeValue.type}
                        {localAttributeValue.required && (
                            <span className="ml-2 text-red-400">• Required</span>
                        )}
                    </div>
                    <span className="text-gray-400 text-lg font-mono">
                        {isExpanded ? 'Collapse' : 'Expand'}
                    </span>
                </div>
            </div>

            {/* Expandable details */}
            <div className={`overflow-hidden transition-all duration-200 ease-in-out ${isExpanded ? 'max-h-[1000px] mt-3 pt-3 border-t border-gray-600' : 'max-h-0'
                }`}>
                <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                        <label className="block text-gray-400 text-sm mb-1">Attribute Name</label>
                        <input
                            type="text"
                            value={keyName}
                            onChange={(e) => setKeyName(e.target.value)}
                            className="bg-gray-800 text-white p-1 rounded w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-1">Type</label>
                        <select
                            value={localAttributeValue.type}
                            onChange={handleTypeChange}
                            className="bg-gray-800 text-white p-1 rounded w-full"
                            disabled={isNested && (localAttributeValue.type === 'object' || localAttributeValue.type === 'array')}
                        >
                            {getAvailableTypes().map((type) => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id={`required-${attributeKey}`}
                            checked={localAttributeValue.required || false}
                            onChange={handleRequiredChange}
                            className="mr-2"
                        />
                        <label htmlFor={`required-${attributeKey}`} className="text-gray-400 text-sm">Required</label>
                    </div>

                    {(localAttributeValue.type === "array" || localAttributeValue.type === "object") && !isNested && (
                        <div>
                            <label className="block text-gray-400 text-sm mb-1">Storage</label>
                            <select
                                value={localAttributeValue.storage || "embedded"}
                                onChange={handleStorageChange}
                                className="bg-gray-800 text-white p-1 rounded w-full"
                            >
                                {storageOptions.map((option) => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="mb-3">
                    <label className="block text-gray-400 text-sm mb-1">Validation Rules</label>
                    <div className="flex space-x-2 mb-2">
                        <input
                            type="text"
                            placeholder="Key (e.g., pattern)"
                            value={validationKey}
                            onChange={(e) => setValidationKey(e.target.value)}
                            className="bg-gray-800 text-white p-1 rounded flex-1"
                        />
                        <input
                            type="text"
                            placeholder="Value (e.g., ^[A-Z]+$)"
                            value={validationValue}
                            onChange={(e) => setValidationValue(e.target.value)}
                            className="bg-gray-800 text-white p-1 rounded flex-1"
                        />
                        <button
                            onClick={handleValidationAdd}
                            className="bg-blue-600 text-white px-2 rounded hover:bg-blue-700"
                        >
                            Add
                        </button>
                    </div>
                    {localAttributeValue.validation && Object.keys(localAttributeValue.validation).length > 0 && (
                        <div className="bg-gray-800 rounded p-2 max-h-32 overflow-y-auto">
                            {Object.entries(localAttributeValue.validation).map(([key, value]) => (
                                <div key={key} className="flex justify-between items-center mb-1 last:mb-0">
                                    <span className="text-cyan-300">{key}:</span>
                                    <span className="text-gray-300">{value}</span>
                                    <button
                                        onClick={() => handleValidationRemove(key)}
                                        className="text-red-400 hover:text-red-300"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {(localAttributeValue.type === "object" || localAttributeValue.type === "array") && !isNested && (
                    <div className="mt-3">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-gray-400">Sub-attributes</h4>
                            <button
                                onClick={handleAddSubAttribute}
                                className="text-white hover:text-cyan-400 text-sm"
                            >
                                + Add Sub-attribute
                            </button>
                        </div>

                        {localAttributeValue.properties && Object.keys(localAttributeValue.properties).length > 0 ? (
                            <div className="bg-gray-800 rounded p-2 space-y-2 max-h-64 overflow-y-auto">
                                {Object.entries(localAttributeValue.properties).map(([subKey, subValue]) => (
                                    <AttributeEditor
                                        key={subKey}
                                        attributeKey={subKey}
                                        attributeValue={subValue}
                                        onAttributeChange={(key, value) => onSubAttributeChange(attributeKey, key, value)}
                                        onRequiredChange={(key, required) => onSubAttributeChange(attributeKey, key, { ...subValue, required })}
                                        onValidationChange={(key, valKey, valValue) => {
                                            const newValidation = { ...subValue.validation, [valKey]: valValue };
                                            onSubAttributeChange(attributeKey, key, { ...subValue, validation: newValidation });
                                        }}
                                        isNested={true}
                                    />
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">No sub-attributes defined</p>
                        )}
                    </div>
                )}
            </div>
        </li>
    );
}

export default EditableCard;