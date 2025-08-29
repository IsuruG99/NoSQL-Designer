import React, { memo, useContext, useState, useEffect, useCallback, use } from 'react';
import { SchemaContext } from '../../context/SchemaContext';
import '../../css/customScrollbar.css';
import {
    getTypeHandler,
    createAttribute,
    updateAttribute
} from '../../utils/attributeHandlers';
import { AttributeEditor } from '../layout/attributeEditor';
import { TrashIcon, XMarkIcon } from '@heroicons/react/24/solid';

// DISCLAIMER: * Almost the entire structure of how EditCard , AttributeHandler and AttributeEditor performs is made in tandem with GPT-4. It was extremely complex.

// Memoize AttributeEditor to prevent unnecessary re-renders
// avoids re-rendering unless necessary.
const MemoizedAttributeEditor = memo(AttributeEditor);

/**
 * EditableCard allows creating or editing a schema entity (collection).
 * 
 * @param {object} props
 * @param {function} props.handleCloseModal - Function to close the modal.
 * @param {boolean} [props.isNewCard=false] - Flag indicating if this is a new entity.
 */
function EditableCard({ handleCloseModal, isNewCard = false }) {
    const {
        entities,
        setEntities,
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

    // Initialize entity name and description if editing an existing card
    // Context: This Modal is also used for adding new cards, we're ignoring those
    useEffect(() => {
        if (!isNewCard && tempSelectedEntity) {
            setEntityName(tempSelectedEntity.name || "");
            setEntityDescription(tempSelectedEntity.description || "");
            setTempKeys(Object.keys(tempSelectedEntity.attributes || {}));
        }
    }, [tempSelectedEntity, isNewCard]);

    const handleNameChange = useCallback((e) => {
        const newName = e.target.value;
        setEntityName(newName);
        setTempSelectedEntity(prev => ({ ...prev, name: newName }));
    }, [setTempSelectedEntity]);

    const handleDescriptionChange = useCallback((e) => {
        const newDescription = e.target.value;
        setEntityDescription(newDescription);
        setTempSelectedEntity({ ...tempSelectedEntity, description: newDescription });
    }, [tempSelectedEntity]);

    const updateAttributes = useCallback((updatedAttributes) => {
        setTempSelectedEntity({ ...tempSelectedEntity, attributes: updatedAttributes });
        setTempKeys(Object.keys(updatedAttributes));
    }, [tempSelectedEntity]);

    const handleAttributeChange = useCallback((keyPath, field, value) => {
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
    }, [tempSelectedEntity, updateAttributes]);

    const handleAddAttribute = useCallback(() => {
        const newKey = `newAttribute${tempKeys.length + 1}`;
        const updatedAttributes = {
            ...(tempSelectedEntity?.attributes || {}),
            [newKey]: createAttribute("string")
        };
        updateAttributes(updatedAttributes);
    }, [tempKeys, tempSelectedEntity, updateAttributes]);

    const handleDelete = useCallback(() => {
        if (!originalSelectedEntity?.name) return;
        if (!window.confirm(`Are you sure you want to delete "${originalSelectedEntity.name}"? This cannot be undone.`)) return;

        const updatedEntities = entities.filter(e => e.name !== originalSelectedEntity.name);
        setEntities(updatedEntities);
        setOriginalSelectedEntity(null);
        setTempSelectedEntity(null);
        setSelectedEntity(null);
        handleCloseModal();
    }, [
        entities,
        originalSelectedEntity,
        setEntities,
        setOriginalSelectedEntity,
        setTempSelectedEntity,
        setSelectedEntity,
        handleCloseModal
    ]);

    const handleSave = useCallback(() => {
        try {
            if (!entityName.trim()) throw new Error("Collection name cannot be blank.");
            if (!tempSelectedEntity?.attributes || Object.keys(tempSelectedEntity.attributes).length === 0) {
                throw new Error("Collection must have at least one attribute.");
            }

            let updatedEntities;
            if (isNewCard) {
                updatedEntities = [
                    ...entities,
                    {
                        name: entityName,
                        ...(entityDescription.trim() && { description: entityDescription.trim() }),
                        attributes: tempSelectedEntity.attributes
                    }
                ];
            } else {
                updatedEntities = entities.map(e =>
                    e.name === originalSelectedEntity.name
                        ? {
                            ...e,
                            name: entityName,
                            ...(entityDescription.trim() && { description: entityDescription.trim() }),
                            attributes: tempSelectedEntity.attributes
                        }
                        : e
                );
            }

            setEntities(updatedEntities);
            setOriginalSelectedEntity(null);
            setTempSelectedEntity(null);
            setSelectedEntity(null);
            handleCloseModal();
        } catch (error) {
            toast.error(error.message, {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true
            });
            console.error("Error saving entity:", error);
        }
    }, [
        entityName,
        entityDescription,
        tempSelectedEntity,
        entities,
        isNewCard,
        originalSelectedEntity,
        setEntities,
        setOriginalSelectedEntity,
        setTempSelectedEntity,
        setSelectedEntity,
        handleCloseModal
    ]);

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
                        className="text-xl px-2 font-bold bg-gray-700 text-white p-1 rounded w-full" />
                </div>
                {entityDescription && (
                    <div className="mb-2">
                        <label className="block text-gray-400 text-sm mb-1">Description</label>
                        <input
                            type="text"
                            value={entityDescription}
                            onChange={handleDescriptionChange}
                            className="bg-gray-700 px-2 text-white p-1 rounded w-full" />
                    </div>
                )}
            </div>

            <hr className="border-gray-600" />

            {/* Attributes Section */}
            <div className="flex-1 overflow-y-auto custom-scrollbar max-h-[50vh] p-4">
                <h3 className="text-lg font-bold text-cyan-400 mb-2">Attributes</h3>
                <ul className="space-y-2">
                    {tempKeys.map((key) => (
                        // <AttributeEditor
                        <MemoizedAttributeEditor
                            key={key}
                            attributeKey={key}
                            attributeValue={tempSelectedEntity?.attributes[key]}
                            onAttributeChange={handleAttributeChange}
                            isNested={false} />
                    ))}
                </ul>
                <button
                    onClick={handleAddAttribute}
                    className="text-white hover:text-cyan-400 text-xl mt-2 flex items-center w-full 
                    justify-center py-2 border border-dashed border-gray-600 rounded-lg">
                    + Add Attribute
                </button>
            </div>

            <hr className="border-gray-600" />
            <div className="p-4 flex justify-between items-center">
                {/* Left: Delete Collection (only show if not new card) */}
                {!isNewCard ? (
                    <button
                        onClick={handleDelete}
                        className="px-4 py-2 text-white rounded bg-red-800 hover:bg-red-800 
                        border-red-500 border-b-3"
                        title="Delete Collection">
                        <TrashIcon className="h-5 w-5 inline mr-1" />
                    </button>
                ) : <div />}

                {/* Right: Cancel/Save */}
                <div className="flex space-x-2">
                    <button
                        onClick={handleCloseModal}
                        className="px-4 py-2 text-white rounded bg-gray-600 hover:bg-gray-700 
                        border-gray-500 border-b-3"
                        title="Cancel">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 text-white rounded bg-green-800 hover:bg-green-700 
                        border-green-500 border-b-3"
                        title={isNewCard ? "Create Collection" : "Update Collection"}>
                        {isNewCard ? 'Create' : 'Update'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default EditableCard;