import { createContext, useState, useEffect, useCallback } from 'react';

/**
 * React Context for managing schema and entities.
 * Provides current schema, entities list, selected entity state,
 * and setters for all of them.
 */
export const SchemaContext = createContext();

/**
 * Provider component for SchemaContext.
 * Manages schema, entities, and selected entity state, persisting them to localStorage.
 * Validates entities and schema to ensure data integrity.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Child components
 */
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
  const [entities, setEntitiesState] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem('schema'));
      return s?.entities || [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    if (schema && Array.isArray(schema.entities)) {
      setEntitiesState(schema.entities);
    }
  }, [schema]);

  /**
   * Validates an entity’s attributes, ensuring required fields have types.
   * @param {object} entity - Entity to validate
   * @returns {boolean} - True if valid, false otherwise
   */
  const validateEntity = useCallback((entity) => {
    if (!entity || !entity.attributes) return false;

    let isValid = true;
    Object.entries(entity.attributes).forEach(([attrName, attrValue]) => {
      if (attrValue.required && attrValue.type === undefined) {
        console.error(`Required field ${attrName} is missing type`);
        isValid = false;
      }
    });

    return isValid;
  }, []);

  /**
   * Updates entities and syncs schema with new collections.
   * @param {Array} newEntities - Array of entity objects
   */
  const setEntities = useCallback((newEntities) => {
    const allValid = newEntities.every(validateEntity);
    if (!allValid) {
      console.error("Invalid schema data - not saving");
      return;
    }
    setSchema(prev => {
      if (!prev) {
        const collections = {};
        newEntities.forEach(entity => {
          collections[entity.name] = entity;
        });
        return { entities: newEntities, collections };
      }
      
      const newCollections = {};
      newEntities.forEach(entity => {
        newCollections[entity.name] = entity;
      });
      const updatedSchema = { 
        ...prev, 
        entities: newEntities, 
        collections: newCollections 
      };
      
      localStorage.setItem('schema', JSON.stringify(updatedSchema));
      return updatedSchema;
    });
    
    setEntitiesState(newEntities);
  }, [setSchema, validateEntity]);

  /**
   * Validates a schema, ensuring it has valid entities.
   * @param {object} schema - Schema to validate
   * @returns {boolean} - True if valid, false otherwise
   */
  const validateSchema = (schema) => {
  if (!schema) return false;
  if (!schema.entities || !Array.isArray(schema.entities)) return false;
  return schema.entities.every(validateEntity);
};

  useEffect(() => {
    if (schema !== null) {
      localStorage.setItem('schema', JSON.stringify(schema));
    }
  }, [schema]);

  useEffect(() => {
    if (schema) {
      const isValid = schema.entities?.every(validateEntity) ?? false;
      if (!isValid) {
        console.error("Loaded schema contains invalid data");
      }
    }
  }, [schema, validateEntity]);

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