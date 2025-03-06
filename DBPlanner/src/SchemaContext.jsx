import { createContext, useState, useEffect } from 'react';

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
    if (schema !== null) {
      localStorage.setItem('schema', JSON.stringify(schema));
    }
  }, [schema]);

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
      selectedEntity, setSelectedEntity,
      originalSelectedEntity, setOriginalSelectedEntity,
      tempSelectedEntity, setTempSelectedEntity
    }}>
      {children}
    </SchemaContext.Provider>
  );
};