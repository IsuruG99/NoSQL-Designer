import React, { useContext } from 'react';
import { SchemaContext } from './SchemaContext.jsx';

const ExportComponent = () => {
    const { schema } = useContext(SchemaContext);

    const downloadJSON = () => {
        // Clean up the schema for export - remove $schema, $meta, and exportOptions
        const { $schema, $meta, exportOptions, ...cleanSchema } = schema;
        
        // Convert to MongoDB-friendly format
        const mongoCollections = {};
        
        if (cleanSchema.collections) {
            Object.entries(cleanSchema.collections).forEach(([collectionName, collectionData]) => {
                mongoCollections[collectionName] = {
                    validator: {
                        $jsonSchema: {
                            bsonType: "object",
                            required: Object.entries(collectionData.attributes)
                                .filter(([_, attr]) => attr.required)
                                .map(([attrName]) => attrName),
                            properties: Object.fromEntries(
                                Object.entries(collectionData.attributes).map(([attrName, attr]) => {
                                    let bsonType;
                                    switch(attr.type) {
                                        case 'string': bsonType = 'string'; break;
                                        case 'number': bsonType = ['int', 'double', 'long']; break;
                                        case 'boolean': bsonType = 'bool'; break;
                                        case 'date': bsonType = 'date'; break;
                                        case 'array': bsonType = 'array'; break;
                                        case 'object': bsonType = 'object'; break;
                                        case 'enum': bsonType = 'string'; break;
                                        default: bsonType = 'string';
                                    }
                                    
                                    const property = { bsonType };
                                    
                                    if (attr.validation) {
                                        if (attr.validation.minLength !== undefined) {
                                            property.minLength = attr.validation.minLength;
                                        }
                                        if (attr.validation.min !== undefined) {
                                            property.minimum = attr.validation.min;
                                        }
                                    }
                                    
                                    if (attr.type === 'enum') {
                                        property.enum = attr.values;
                                    }
                                    
                                    return [attrName, property];
                                })
                            )
                        }
                    }
                };
            });
        }

        const jsonString = JSON.stringify(mongoCollections, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = 'mongo_schema.json';
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-col items-center justify-center p-4">
            <h2 className='text-xl mt-4 xl:font-bold text-center mb-4'>Export Format</h2>
            <div className="flex space-x-4">
                <button
                    onClick={downloadJSON}
                    className="px-4 py-2 text-white rounded bg-blue-600 hover:bg-blue-700 border-blue-800 border-b-3"
                >
                    MongoDB
                </button>
            </div>
        </div>
    );
};

export default ExportComponent;