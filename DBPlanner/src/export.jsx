import React, { useContext, useState } from 'react';
import { SchemaContext } from './SchemaContext.jsx';

const ExportComponent = () => {
    const { schema } = useContext(SchemaContext);
    const [selectedDB, setSelectedDB] = useState(null);

    const handleMongoExport = (collectionName) => {
        const collectionData = schema.collections[collectionName];

        const documents = [
            Object.fromEntries(
                Object.entries(collectionData.attributes).map(([key, attr]) => {
                    let exampleValue = null;
                    switch(attr.type) {
                        case 'string': exampleValue = 'example'; break;
                        case 'number': exampleValue = 0; break;
                        case 'boolean': exampleValue = true; break;
                        case 'date': exampleValue = new Date().toISOString(); break;
                        case 'array': exampleValue = []; break;
                        case 'object': exampleValue = {}; break;
                        case 'enum': exampleValue = attr.values[0]; break;
                        default: exampleValue = null;
                    }
                    return [key, exampleValue];
                })
            )
        ];

        const blob = new Blob([JSON.stringify(documents, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${collectionName}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-col items-center p-4">
            <h2 className='text-xl font-bold mb-4 text-center'>Choose Export Target</h2>
            <div className="flex space-x-6 mb-6">
                <div onClick={() => setSelectedDB('mongodb')} className="cursor-pointer border rounded p-4 shadow hover:bg-gray-100">
                    <p className='text-lg font-semibold text-center'>MongoDB</p>
                </div>
                <div onClick={() => setSelectedDB('cassandra')} className="cursor-pointer border rounded p-4 shadow hover:bg-gray-100">
                    <p className='text-lg font-semibold text-center'>Cassandra</p>
                </div>
                <div onClick={() => setSelectedDB('firebase')} className="cursor-pointer border rounded p-4 shadow hover:bg-gray-100">
                    <p className='text-lg font-semibold text-center'>Firebase (Raw JSON)</p>
                </div>
            </div>

            {selectedDB === 'mongodb' && (
                <div className="w-full max-w-2xl">
                    <h3 className='text-lg font-semibold mb-4 text-center'>Download MongoDB-Compatible JSON per Collection</h3>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        {Object.keys(schema.collections).map((collectionName) => (
                            <div key={collectionName} className="flex justify-between items-center border p-4 rounded shadow">
                                <span className="font-medium">{collectionName}</span>
                                <button
                                    onClick={() => handleMongoExport(collectionName)}
                                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Download
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {selectedDB === 'firebase' && (
                <div className="mt-6 text-center">
                    <button
                        onClick={() => {
                            const jsonString = JSON.stringify(schema, null, 2);
                            const blob = new Blob([jsonString], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = 'schema.json';
                            link.click();
                            URL.revokeObjectURL(url);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                        Download Full Schema JSON
                    </button>
                </div>
            )}

            {selectedDB === 'cassandra' && (
                <div className="mt-6 text-center">
                    <p className='text-gray-600'>Cassandra export coming soon...</p>
                </div>
            )}
        </div>
    );
};

export default ExportComponent;
