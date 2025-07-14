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

  const validateEntity = useCallback((entity) => {
    if (!entity || !entity.attributes) return false;

    let isValid = true;
    Object.entries(entity.attributes).forEach(([attrName, attrValue]) => {
      // Check required fields
      if (attrValue.required && attrValue.type === undefined) {
        console.error(`Required field ${attrName} is missing type`);
        isValid = false;
      }
    });

    return isValid;
  }, []);

  // When entities change, update schema, collections, and localStorage
  const setEntities = useCallback((newEntities) => {
    // Validate all entities first
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