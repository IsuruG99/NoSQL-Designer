import React, { useContext, useState, useEffect } from 'react';
import { SchemaContext } from '../SchemaContext';
import './customScrollbar.css';
import {
    DATA_TYPES,
    STORAGE_OPTIONS,
    COMMON_VALIDATION_KEYS,
    getTypeHandler,
    createAttribute,
    updateAttribute
} from './attributeHandlers';

function EditableCard({ handleCloseModal, isNewCard = false }) {
    const {
        schema,
        setSchema,
        tempSelectedEntity,
        setTempSelectedEntity,
        originalSelectedEntity,
        setOriginalSelectedEntity,
        setSelectedEntity
    } = useContext(SchemaContext);

    const [entityName, setEntityName] = useState(isNewCard ? "" : tempSelectedEntity?.name || "");
    const [entityDescription, setEntityDescription] = useState(isNewCard ? "" : tempSelectedEntity?.description || "");
    const [tempKeys, setTempKeys] = useState(Object.keys(tempSelectedEntity?.attributes || {}));

    useEffect(() => {
        if (!isNewCard && tempSelectedEntity) {
            setEntityName(tempSelectedEntity.name || "");
            setEntityDescription(tempSelectedEntity.description || "");
            setTempKeys(Object.keys(tempSelectedEntity.attributes || {}));
        }
    }, [tempSelectedEntity, isNewCard]);

    const handleNameChange = (e) => {
        const newName = e.target.value;
        setEntityName(newName);
        setTempSelectedEntity({ ...tempSelectedEntity, name: newName });
    };

    const handleDescriptionChange = (e) => {
        const newDescription = e.target.value;
        setEntityDescription(newDescription);
        setTempSelectedEntity({ ...tempSelectedEntity, description: newDescription });
    };

    const updateAttributes = (updatedAttributes) => {
        setTempSelectedEntity({ ...tempSelectedEntity, attributes: updatedAttributes });
        setTempKeys(Object.keys(updatedAttributes));
    };

    const handleAttributeChange = (keyPath, field, value) => {
        const updatedAttributes = updateAttribute(
            tempSelectedEntity?.attributes || {},
            keyPath,
            field,
            value
        );
        updateAttributes(updatedAttributes);

        if (field === 'rename') {
            setTempKeys(Object.keys(updatedAttributes));
        }
    };

    const handleAddAttribute = () => {
        const newKey = `newAttribute${tempKeys.length + 1}`;
        const updatedAttributes = {
            ...(tempSelectedEntity?.attributes || {}),
            [newKey]: createAttribute("string")
        };
        updateAttributes(updatedAttributes);
    };

    const handleSave = () => {
        try {
            if (!entityName.trim()) throw new Error("Collection name cannot be blank.");
            if (!tempSelectedEntity?.attributes || Object.keys(tempSelectedEntity.attributes).length === 0) {
                throw new Error("Collection must have at least one attribute.");
            }

            const updatedSchema = { ...schema, collections: { ...schema.collections } };

            if (!isNewCard && originalSelectedEntity?.name) {
                delete updatedSchema.collections[originalSelectedEntity.name];
            }

            updatedSchema.collections[entityName] = {
                name: entityName,
                description: entityDescription,
                attributes: tempSelectedEntity.attributes
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
            {/* Header Section */}
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

            {/* Attributes Section */}
            <div className="flex-1 overflow-y-auto custom-scrollbar max-h-[50vh] p-4">
                <h3 className="text-lg font-bold text-cyan-400 mb-2">Attributes</h3>

                <ul className="space-y-2">
                    {tempKeys.map((key) => (
                        <AttributeEditor
                            key={key}
                            attributeKey={key}
                            attributeValue={tempSelectedEntity?.attributes[key]}
                            onAttributeChange={handleAttributeChange}
                            isNested={false}
                        />
                    ))}
                </ul>

                <button
                    onClick={handleAddAttribute}
                    className="text-white hover:text-cyan-400 text-xl mt-2 flex items-center w-full justify-center py-2 border border-dashed border-gray-600 rounded-lg"
                >
                    + Add Attribute
                </button>
            </div>

            <hr className="border-gray-600" />

            {/* Footer Actions */}
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
    isNested
}) {
    const [keyName, setKeyName] = useState(attributeKey);
    const [validationKey, setValidationKey] = useState("");
    const [customKey, setCustomKey] = useState("");
    const [useCustomKey, setUseCustomKey] = useState(false);
    const [validationValue, setValidationValue] = useState("");
    const [isExpanded, setIsExpanded] = useState(false);
    const [isValidationExpanded, setIsValidationExpanded] = useState(false);

    useEffect(() => {
        setKeyName(attributeKey);
    }, [attributeKey]);

    const handleValidationAdd = () => {
        if (validationKey && validationValue) {
            onAttributeChange(attributeKey, 'validation', { key: validationKey, value: validationValue });
            setValidationKey("");
            setValidationValue("");
        }
    };

    const handleKeyRename = () => {
        if (keyName !== attributeKey && keyName.trim() !== "") {
            onAttributeChange(attributeKey, 'rename', keyName.trim());
        }
    };

    const handleAddSubAttribute = () => {
        if (['object', 'array'].includes(attributeValue.type)) {
            const newKey = `newSubAttribute${Object.keys(attributeValue.properties || {}).length + 1}`;
            onAttributeChange(`${attributeKey}.properties.${newKey}`, 'type', 'string');
        }
    };

    const getAvailableTypes = () =>
        isNested ? DATA_TYPES.filter(type => !['object', 'array', 'null'].includes(type)) : DATA_TYPES;

    const Wrapper = isNested ? 'div' : 'li';

    return (
        <Wrapper className="bg-gray-800">
            <li className="bg-gray-700 rounded-lg p-3">
                <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                    <div className="font-medium text-white">{keyName || "Unnamed attribute"}</div>
                    <div className="flex items-center">
                        <div className="text-sm text-gray-400 mr-2">
                            {attributeValue.type}
                            {attributeValue.isKey && <span className="ml-2 text-yellow-400">• Key</span>}
                            {attributeValue.required && <span className="ml-2 text-red-400">• Required</span>}
                        </div>
                        {/* <span className="text-gray-400 text-lg font-mono">
                        {isExpanded ? 'Collapse' : 'Expand'}
                    </span> */}
                    </div>
                </div>

                {/* Expanded content */}
                <div className={`overflow-hidden transition-all duration-200 ${isExpanded ? 'max-h-[1000px] mt-3 pt-3 border-t border-gray-600' : 'max-h-0'}`}>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <div>
                            <label className="block text-gray-400 text-sm mb-1">Attribute Name</label>
                            <input
                                type="text"
                                value={keyName}
                                onChange={e => setKeyName(e.target.value)}
                                onBlur={handleKeyRename}
                                className="bg-gray-800 text-white p-1 rounded w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-400 text-sm mb-1">Type</label>
                            <select
                                value={attributeValue.type}
                                onChange={e => onAttributeChange(attributeKey, 'type', e.target.value)}
                                className="bg-gray-800 text-white p-1 rounded w-full"
                                disabled={isNested && ['object', 'array'].includes(attributeValue.type)}
                            >
                                {getAvailableTypes().map((type) => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Required and Storage */}
                    <div className="grid grid-cols-8 gap-2 mb-2">
                        <div className="col-span-2 flex items-center">
                            <input
                                type="checkbox"
                                id={`required-${attributeKey}`}
                                checked={attributeValue.required || false}
                                onChange={e => onAttributeChange(attributeKey, 'required', e.target.checked)}
                                className="mr-2"
                            />
                            <label htmlFor={`required-${attributeKey}`} className="text-gray-400 text-sm">Required</label>
                        </div>
                        <div className="col-span-2 flex items-center">
                            <input
                                type="checkbox"
                                id={`isKey-${attributeKey}`}
                                checked={attributeValue.isKey || false}
                                onChange={e => onAttributeChange(attributeKey, 'isKey', e.target.checked)}
                                className="mr-2"
                            />
                            <label htmlFor={`isKey-${attributeKey}`} className="text-gray-400 text-sm">isKey</label>
                        </div>
                        {['array', 'object'].includes(attributeValue.type) && !isNested && (
                            <div className="col-span-4">
                                <label className="block text-gray-400 text-sm mb-1">Storage</label>
                                <select
                                    value={attributeValue.storage || "embedded"}
                                    onChange={e => onAttributeChange(attributeKey, 'storage', e.target.value)}
                                    className="bg-gray-800 text-white p-1 rounded w-full"
                                >
                                    {STORAGE_OPTIONS.map((option) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Validation */}
                    {attributeValue.type !== "null" && (
                        <div className="mb-3 bg-gray-800 rounded p-2 border border-gray-600">
                            <div
                                className="flex items-center justify-between cursor-pointer select-none"
                                onClick={() => setIsValidationExpanded(v => !v)}
                            >
                                <span className="text-gray-300 text-base font-medium">Validation Rules</span>
                                <span className={`ml-2 text-xs ${isValidationExpanded ? "text-cyan-400" : "text-cyan-300"}`}>
                                    {isValidationExpanded ? "▲ Hide" : "▼ Show"}
                                </span>
                            </div>
                            {isValidationExpanded && (
                                <>
                                    <div className="flex mx-1 space-x-2 mb-2">
                                        <select
                                            value={useCustomKey ? "custom" : validationKey}
                                            onChange={e => {
                                                if (e.target.value === "custom") {
                                                    setUseCustomKey(true);
                                                    setValidationKey("");
                                                } else {
                                                    setUseCustomKey(false);
                                                    setValidationKey(e.target.value);
                                                }
                                            }}
                                            className="bg-gray-800 text-white p-1 rounded flex-1"
                                        >
                                            <option value="" disabled>Select rule</option>
                                            {COMMON_VALIDATION_KEYS.map(key => (
                                                <option key={key} value={key}>{key}</option>
                                            ))}
                                            <option value="custom">Other...</option>
                                        </select>
                                        {useCustomKey && (
                                            <input
                                                type="text"
                                                placeholder="Custom key"
                                                value={customKey}
                                                onChange={e => setCustomKey(e.target.value)}
                                                className="bg-gray-800 text-white p-1 rounded flex-1"
                                            />
                                        )}
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
                                    {attributeValue.validation && Object.keys(attributeValue.validation).length > 0 && (
                                        <div className="mx-1 bg-gray-800 rounded p-1 max-h-32 overflow-y-auto">
                                            {Object.entries(attributeValue.validation).map(([key, value]) => (
                                                <div key={key} className="mx-1 flex justify-between items-center mb-1 last:mb-0">
                                                    <span className="text-cyan-300">{key}:</span>
                                                    <span className="text-gray-300">{value}</span>
                                                    <button
                                                        onClick={() => onAttributeChange(attributeKey, 'deleteValidation', key)}
                                                        className="text-red-400 hover:text-red-300"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* Object and Array Sub-attributes */}
                    {attributeValue.type === 'object' && !isNested && (
                        <div className="mt-3 bg-gray-800 rounded p-2">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-gray-400">Sub-attributes</h4>
                                <button
                                    onClick={handleAddSubAttribute}
                                    className="text-white hover:text-cyan-400 text-sm"
                                >
                                    + Add Sub-attribute
                                </button>
                            </div>

                            {attributeValue.properties && Object.keys(attributeValue.properties).length > 0 ? (
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {Object.entries(attributeValue.properties).map(([subKey, subValue]) => (
                                        <AttributeEditor
                                            key={subKey}
                                            attributeKey={subKey}
                                            attributeValue={subValue}
                                            onAttributeChange={(key, field, value) =>
                                                onAttributeChange(`${attributeKey}.properties.${key}`, field, value)
                                            }
                                            isNested={true}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm">No sub-attributes defined</p>
                            )}
                        </div>
                    )}

                    {attributeValue.type === 'array' && !isNested && (
                        <div className="mt-3 bg-gray-800 rounded p-2">
                            <h4 className="text-gray-400 mb-2">Array Item Type</h4>
                            {/* Array items editor: allow editing the schema for array elements */}
                            {attributeValue.items ? (
                                <AttributeEditor
                                    attributeKey="items"
                                    attributeValue={attributeValue.items}
                                    onAttributeChange={(key, field, value) =>
                                        onAttributeChange(`${attributeKey}.items${key !== "items" ? `.${key}` : ""}`, field, value)
                                    }
                                    isNested={true}
                                />
                            ) : (
                                <button
                                    onClick={() => onAttributeChange(`${attributeKey}.items`, 'type', 'string')}
                                    className="text-white hover:text-cyan-400 text-sm"
                                >
                                    + Define Array Item Type
                                </button>
                            )}
                        </div>
                    )}

                    <div className="mt-3 flex justify-end">
                        <button
                            onClick={() => {
                                if (window.confirm(`Are you sure you want to delete "${keyName || attributeKey}"?`)) {
                                    onAttributeChange(attributeKey, 'delete', true);
                                }
                            }}
                            className="text-red-400 hover:text-red-300 text-sm"
                        >
                            {`Delete ${keyName || attributeKey}`}
                        </button>
                    </div>
                </div>
            </li>
        </Wrapper>
    );
}

export default EditableCard;