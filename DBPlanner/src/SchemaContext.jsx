import { createContext, useState } from 'react';

export const SchemaContext = createContext();

export const SchemaProvider = ({ children }) => {
  const [schema, setSchema] = useState(null);

  return (
    <SchemaContext.Provider value={{ schema, setSchema }}>
      {children}
    </SchemaContext.Provider>
  );
};