import React, { useContext, useState } from 'react';
import { SchemaContext } from './context/SchemaContext.jsx';
import { getCassandraExport } from './components/exporters/cassandraExporter.js';
import { getMongoExport } from './components/exporters/mongoExporter.js';
import { getJSONExport } from './components/exporters/jsonExporter.js';
import { getFirebaseExport } from './components/exporters/firebaseExporter.js';
import { downloadFile } from './utils/downloadFile.js';
import './css/index.css';
import ajv from 'ajv';

const ExportComponent = () => {
    const { schema } = useContext(SchemaContext);
    const [schemaWarning, setSchemaWarning] = useState(false);
    const [selectedDB, setSelectedDB] = useState(null);
    const [selectedCollection, setSelectedCollection] = useState(null);
    const [cql, setCql] = useState('');
    const [keyspace, setKeyspace] = useState('');

    const isSchemaReady = schema?.collections && Object.keys(schema.collections).length > 0;

    const handleCopy = () => {
        navigator.clipboard.writeText(cql);
    };

    const handleCassandraSelect = (collectionName, keyspaceValue) => {
        setSelectedCollection(collectionName);
        const cqlCode = getCassandraExport(collectionName, schema, keyspaceValue);
        setCql(cqlCode);
    };

    const handleDownload = () => {
        downloadFile(cql, `${selectedCollection}.cql`);
    };

    const handleMongoExport = (collectionName) => {
        const exportData = getMongoExport(schema.collections[collectionName], collectionName);
        try {
            downloadFile(exportData.content, exportData.fileName, exportData.mimeType);
        } catch (error) {
            setValidationError(`Invalid JSON: ${error.message}`);
        }
    };

    return (
        <div className="flex flex-col items-center p-4 bg-gray-900 text-white min-h-screen w-full">
            <h2 className='text-xl font-bold mb-4 text-center'>Choose Export Target</h2>
            <div className="flex space-x-6 mb-6">
                <div
                    onClick={() => {
                        setSelectedDB('firestore');
                        setSchemaWarning(!isSchemaReady);
                    }}
                    className={`cursor-pointer border rounded p-4 shadow hover:bg-gray-800 ${!isSchemaReady ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <p className='text-lg font-semibold text-center'>Firebase</p>
                    <p className='text-sm text-gray-300'>Realtime Database JSON</p>
                </div>
                <div
                    onClick={() => {
                        setSelectedDB('mongodb');
                        setSchemaWarning(!isSchemaReady);
                    }}
                    className={`cursor-pointer border rounded p-4 shadow hover:bg-gray-800 ${!isSchemaReady ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <p className='text-lg font-semibold text-center'>MongoDB</p>
                    <p className='text-sm text-gray-300'>JSON per Collection</p>
                </div>
                <div
                    onClick={() => {
                        setSelectedDB('cassandra');
                        setSchemaWarning(!isSchemaReady);
                    }}
                    className={`cursor-pointer border rounded p-4 shadow hover:bg-gray-800 ${!isSchemaReady ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <p className='text-lg font-semibold text-center'>Cassandra</p>
                    <p className='text-sm text-gray-300'>CQL per Collection</p>
                </div>
                <div
                    onClick={() => {
                        setSelectedDB('json');
                        setSchemaWarning(!isSchemaReady);
                    }}
                    className={`cursor-pointer border rounded p-4 shadow hover:bg-gray-800 ${!isSchemaReady ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <p className='text-lg font-semibold text-center'>JSON</p>
                    <p className='text-sm text-gray-300'>Full schema JSON</p>
                </div>
            </div>

            {schemaWarning && (
                <div className="text-red-400 italic mb-4">
                    Please generate a schema first to see available collections.
                </div>
            )}
            {isSchemaReady && selectedDB === 'firestore' && (
                <div className="w-full max-w-2xl mt-6 text-center">
                    <h3 className="text-lg font-semibold mb-4">Firebase / Firestore</h3>
                    <div>
                        <button
                            onClick={() => {
                                const exportData = getJSONExport(schema, true);
                                downloadFile(exportData.content, exportData.fileName, exportData.mimeType);
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 border-b-4 border-blue-800 shadow"
                        >
                            Download JSON
                        </button>
                    </div>
                    <div className="mt-4 text-sm text-gray-300 max-w-xl mx-auto">
                        <p>
                            This JSON export can be directly imported into{' '}
                            <strong>
                                <a
                                    href="https://console.firebase.google.com/project/_/database/data"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline hover:text-blue-700"
                                >
                                    Firebase Realtime Database
                                </a>
                            </strong>.
                        </p>
                        <p>
                            For <strong>Firestore</strong>, importing requires a script using the Firebase SDK.
                            See the official{' '}
                            <strong>
                                <a
                                    href="https://firebase.google.com/docs/firestore/manage-data/add-data#node.js_2"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline hover:text-blue-700"
                                >
                                    Firestore docs
                                </a></strong>{' '}
                            for guidance.
                        </p>
                    </div>
                </div>
            )}

            {isSchemaReady && selectedDB === 'mongodb' && (
                <div className="w-full max-w-2xl mt-6">
                    <h3 className='text-lg font-semibold mb-4 text-center'>Download MongoDB-Compatible JSON per Collection</h3>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        {Object.keys(schema.collections).map((collectionName) => (
                            <div key={collectionName} className="flex justify-between items-center border p-4 rounded shadow">
                                <span className="font-medium">{collectionName}</span>
                                <button
                                    onClick={() => handleMongoExport(collectionName)}
                                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 border-b-4 border-blue-800"
                                >
                                    Download
                                </button>
                            </div>
                        ))}
                    </div>

                </div>
            )}
            {isSchemaReady && selectedDB === 'json' && (
                <div className="mt-6 text-center">
                    <button
                        onClick={() => {
                            const exportData = getJSONExport(schema);
                            downloadFile(exportData.content, exportData.fileName, exportData.mimeType);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 border-b-4 border-green-800 shadow"
                    >
                        Download Full Schema as JSON
                    </button>
                </div>
            )}
            {isSchemaReady && selectedDB === 'cassandra' && (
                <div className="w-full max-w-2xl mt-6">
                    <h3 className='text-lg font-semibold mb-4 text-center'>Cassandra Table Export</h3>

                    {/* Keyspace input */}
                    <div className="mb-4 flex items-center gap-2 justify-center">
                        <label htmlFor="keyspace" className="text-white-700 font-medium">Keyspace:</label>
                        <input
                            id="keyspace"
                            type="text"
                            value={keyspace}
                            onChange={e => setKeyspace(e.target.value)}
                            placeholder="(optional)"
                            className="border rounded px-2 py-1 w-48 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4 justify-center">
                        {Object.keys(schema.collections).map((collectionName) => (
                            <button
                                key={collectionName}
                                onClick={() => handleCassandraSelect(collectionName, keyspace)}
                                className={`px-3 py-1 rounded border shadow ${selectedCollection === collectionName ?
                                    'bg-cyan-600 hover:bg-cyan-700 border-cyan-800 border-b-4' : 'shadow bg-blue-600 hover:bg-blue-700 border-blue-800 border-b-4'}`}
                            >
                                {collectionName}
                            </button>
                        ))}
                    </div>
                    {selectedCollection && (
                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-medium">{selectedCollection} CQL</span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleCopy}
                                        className="px-2 py-1 text-white rounded text-sm shadow bg-pink-600 hover:bg-pink-700 border-pink-800 border-b-4"
                                    >
                                        Copy
                                    </button>
                                    <button
                                        onClick={handleDownload}
                                        className="px-2 py-1 text-white rounded text-sm shadow bg-green-600 hover:bg-green-700 border-green-800 border-b-4"
                                    >
                                        Download
                                    </button>
                                </div>
                            </div>
                            <pre className="bg-gray-900 text-green-300 rounded p-4 overflow-x-auto overflow-y-auto" style={{ minHeight: 120, maxHeight: 320 }}>
                                <code>{cql}</code>
                            </pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ExportComponent;
