import { createContext, useState } from 'react';

export const SchemaContext = createContext();

export const SchemaProvider = ({ children }) => {
  const [schema, setSchema] = useState(null);
  const [selectedEntity, setSelectedEntity] = useState(null);

  return (
    <SchemaContext.Provider value={{ schema, setSchema, selectedEntity, setSelectedEntity }}>
      {children}
    </SchemaContext.Provider>
  );
};