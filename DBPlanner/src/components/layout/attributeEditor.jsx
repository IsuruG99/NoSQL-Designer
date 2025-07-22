import React, { useState, useEffect } from 'react';
import { DATA_TYPES, STORAGE_OPTIONS } from '../../utils/attributeHandlers';

/**
 * AttributeEditor renders a single attribute's editing interface.
 * Handles types, required/key flags, sub-attributes (for objects/arrays), and example values.
 *
 * @param {Object} props
 * @param {string} props.attributeKey - The current attribute key name.
 * @param {Object} props.attributeValue - The attribute's definition object.
 * @param {Function} props.onAttributeChange - Callback to notify parent of changes.
 * @param {boolean} props.isNested - Whether the attribute is a nested child (limits options).
 */
export function AttributeEditor({
    attributeKey, attributeValue, onAttributeChange, isNested
}) {
    const [keyName, setKeyName] = useState(attributeKey);
    const [exampleInput, setExampleInput] = useState("");
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        setKeyName(attributeKey);
    }, [attributeKey]);

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

    const getAvailableTypes = () => isNested ? DATA_TYPES.filter(type => !['object', 'array', 'null'].includes(type)) : DATA_TYPES;

    const Wrapper = isNested ? 'div' : 'li';

    return (
        <Wrapper className="bg-gray-800">
            <li className="bg-gray-700 rounded-lg p-3">
                {/* Header with toggle */}
                <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                    <div className="font-medium text-white">{keyName || "Unnamed attribute"}</div>
                    <div className="flex items-center">
                        <div className="text-sm text-gray-400 mr-2">
                            {attributeValue.type}
                            {attributeValue.isKey && <span className="ml-2 text-yellow-400">• Key</span>}
                            {attributeValue.required && <span className="ml-2 text-red-400">• Required</span>}
                        </div>
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
                                className="bg-gray-800 px-2 text-white p-1 rounded w-full" />
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
                                className="mr-2" />
                            <label htmlFor={`required-${attributeKey}`} className="text-gray-400 text-sm">Required</label>
                        </div>
                        <div className="col-span-2 flex items-center">
                            <input
                                type="checkbox"
                                id={`isKey-${attributeKey}`}
                                checked={attributeValue.isKey || false}
                                onChange={e => onAttributeChange(attributeKey, 'isKey', e.target.checked)}
                                className="mr-2" />
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

                    {/* Examples */}
                    {attributeValue.type !== "null" && (
                        <div className="mb-3">
                            <label className="block text-gray-400 text-sm mb-1">Examples</label>
                            <div className="flex items-center mb-2">
                                <input
                                    type="text"
                                    placeholder="Add example value"
                                    value={exampleInput}
                                    onChange={(e) => setExampleInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && exampleInput.trim()) {
                                            onAttributeChange(attributeKey, 'examples', [...(attributeValue.examples || []), exampleInput.trim()]);
                                            setExampleInput('');
                                        }
                                    }}
                                    className="bg-gray-800 px-2 text-white p-1 rounded flex-1 mr-2" />
                                <button
                                    onClick={() => {
                                        if (exampleInput.trim()) {
                                            onAttributeChange(attributeKey, 'examples', [...(attributeValue.examples || []), exampleInput.trim()]);
                                            setExampleInput('');
                                        }
                                    }}
                                    className="bg-blue-600 text-white px-2 rounded hover:bg-blue-700"
                                >
                                    Add
                                </button>
                            </div>
                            {attributeValue.examples && attributeValue.examples.length > 0 && (
                                <div className="bg-gray-800 rounded p-2 max-h-32 overflow-y-auto">
                                    {attributeValue.examples.map((example, index) => (
                                        <div key={index} className="flex justify-between items-center mb-1 last:mb-0">
                                            <span className="text-gray-300">{example}</span>
                                            <button
                                                onClick={() => {
                                                    const newExamples = [...attributeValue.examples];
                                                    newExamples.splice(index, 1);
                                                    onAttributeChange(attributeKey, 'examples', newExamples);
                                                }}
                                                className="text-red-400 hover:text-red-300"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
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
                                            onAttributeChange={(key, field, value) => onAttributeChange(`${attributeKey}.properties.${key}`, field, value)}
                                            isNested={true} />
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
                                    onAttributeChange={(key, field, value) => onAttributeChange(`${attributeKey}.items${key !== "items" ? `.${key}` : ""}`, field, value)}
                                    isNested={true} />
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
