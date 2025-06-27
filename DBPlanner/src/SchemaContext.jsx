import { createContext, useState, useEffect, useCallback } from 'react';

export const SchemaContext = createContext();

export const SchemaProvider = ({ children }) => {
  const [schema, setSchema] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('schema')) || null;
    } catch (error) {
      console.error("Failed to parse schema from localStorage:", error);
      localStorage.removeItem('schema');
      return null;
    }
  });

  // Entities state, derived from schema.entities or empty array
  const [entities, setEntitiesState] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem('schema'));
      return s?.entities || [];
    } catch {
      return [];
    }
  });

  // Keep entities in sync with schema
  useEffect(() => {
    if (schema && Array.isArray(schema.entities)) {
      setEntitiesState(schema.entities);
    }
  }, [schema]);

  // When entities change, update schema, collections, and localStorage
  const setEntities = useCallback((newEntities) => {
  setSchema(prev => {
    if (!prev) {
      // If schema is missing, create a minimal one
      const collections = {};
      newEntities.forEach(entity => {
        collections[entity.name] = entity;
      });
      // Update both entities and collections in schema
      return { entities: newEntities, collections };
    }
    // Rebuild collections object in the new order
    const newCollections = {};
    newEntities.forEach(entity => {
      newCollections[entity.name] = entity;
    });
    // Update schema with new entities array and collections object
    const updatedSchema = { ...prev, entities: newEntities, collections: newCollections };
    // Also update localStorage immediately for consistency
    localStorage.setItem('schema', JSON.stringify(updatedSchema));
    return updatedSchema;
  });
  // Update UI state for entities
  setEntitiesState(newEntities);
}, [setSchema]);

  useEffect(() => {
    if (schema !== null) {
      localStorage.setItem('schema', JSON.stringify(schema));
    }
  }, [schema]);

  const [selectedEntity, setSelectedEntity] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('selectedEntity')) || null;
    } catch (error) {
      console.error("Failed to parse selectedEntity from localStorage:", error);
      localStorage.removeItem('selectedEntity');
      return null;
    }
  });

  const [originalSelectedEntity, setOriginalSelectedEntity] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('originalSelectedEntity')) || null;
    } catch (error) {
      console.error("Failed to parse originalSelectedEntity from localStorage:", error);
      localStorage.removeItem('originalSelectedEntity');
      return null;
    }
  });

  const [tempSelectedEntity, setTempSelectedEntity] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('tempSelectedEntity')) || null;
    } catch (error) {
      console.error("Failed to parse tempSelectedEntity from localStorage:", error);
      localStorage.removeItem('tempSelectedEntity');
      return null;
    }
  });

  useEffect(() => {
    localStorage.setItem('selectedEntity', JSON.stringify(selectedEntity));
  }, [selectedEntity]);

  useEffect(() => {
    localStorage.setItem('originalSelectedEntity', JSON.stringify(originalSelectedEntity));
  }, [originalSelectedEntity]);

  useEffect(() => {
    localStorage.setItem('tempSelectedEntity', JSON.stringify(tempSelectedEntity));
  }, [tempSelectedEntity]);

  return (
    <SchemaContext.Provider value={{
      schema, setSchema,
      entities, setEntities,
      selectedEntity, setSelectedEntity,
      originalSelectedEntity, setOriginalSelectedEntity,
      tempSelectedEntity, setTempSelectedEntity
    }}>
      {children}
    </SchemaContext.Provider>
  );
};