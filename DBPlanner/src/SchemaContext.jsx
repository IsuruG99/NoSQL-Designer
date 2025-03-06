import { createContext, useState, useEffect } from 'react';

export const SchemaContext = createContext();

export const SchemaProvider = ({ children }) => {
  const [schema, setSchema] = useState(() => JSON.parse(localStorage.getItem('schema')) || null);
  const [selectedEntity, setSelectedEntity] = useState(() => JSON.parse(localStorage.getItem('selectedEntity')) || null);
  const [originalSelectedEntity, setOriginalSelectedEntity] = useState(() => JSON.parse(localStorage.getItem('originalSelectedEntity')) || null);
  const [tempSelectedEntity, setTempSelectedEntity] = useState(() => JSON.parse(localStorage.getItem('tempSelectedEntity')) || null);

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