import React, { useContext, useState } from 'react';
import { SchemaContext } from './context/SchemaContext.jsx';
import './css/index.css'; // Ensure you have a CSS file for basic styles

function generateCQL(collectionName, collectionData, keyspace = "") {
    const typeMap = {
        string: 'text',
        number: 'double',
        boolean: 'boolean',
        date: 'timestamp',
        object: null, // handled below
        array: null,  // handled below
        null: 'text'
    };

    const effectiveKeyspace = keyspace && keyspace.trim() ? keyspace : "default_keyspace";
    const udtDefs = [];
    const udtNames = new Map(); // Map from object signature to UDT name

    // Helper to create a unique UDT name
    function getUDTName(base, depth = 0) {
        let name = `${collectionName}_${base}`;
        if (depth > 0) name += depth;
        let candidate = name;
        let i = 1;
        while (udtNames.has(candidate)) {
            candidate = name + i;
            i++;
        }
        return candidate;
    }

    // Recursively process attribute and return its CQL type
    function processAttr(attr, key, depth = 0) {
        if (attr.type === "object" && attr.properties && Object.keys(attr.properties).length > 0) {
            // Generate a signature for this object type
            const signature = JSON.stringify(Object.keys(attr.properties).sort());
            if (!udtNames.has(signature)) {
                const udtName = getUDTName(key.charAt(0).toUpperCase() + key.slice(1), depth);
                udtNames.set(signature, udtName);
                // Recursively process properties
                const fields = Object.entries(attr.properties).map(([subKey, subAttr]) =>
                    `    "${subKey}" ${processAttr(subAttr, subKey, depth + 1)}`
                );
                udtDefs.push(
                    `CREATE TYPE IF NOT EXISTS "${effectiveKeyspace}"."${udtName}" (\n${fields.join(',\n')}\n);`
                );
            }
            return `frozen<"${udtNames.get(signature)}">`;
        }
        if (attr.type === "array" && attr.items) {
            if (attr.items.type === "object" && attr.items.properties && Object.keys(attr.items.properties).length > 0) {
                // Array of objects: generate UDT for the item
                const signature = JSON.stringify(Object.keys(attr.items.properties).sort());
                if (!udtNames.has(signature)) {
                    const udtName = getUDTName(key.charAt(0).toUpperCase() + key.slice(1) + "Item", depth);
                    udtNames.set(signature, udtName);
                    const fields = Object.entries(attr.items.properties).map(([subKey, subAttr]) =>
                        `    "${subKey}" ${processAttr(subAttr, subKey, depth + 1)}`
                    );
                    udtDefs.push(
                        `CREATE TYPE IF NOT EXISTS "${effectiveKeyspace}"."${udtName}" (\n${fields.join(',\n')}\n);`
                    );
                }
                return `list<frozen<"${udtNames.get(signature)}">>`;
            } else {
                // Array of primitives
                const itemType = typeMap[attr.items.type] || 'text';
                return `list<${itemType}>`;
            }
        }
        // Null: add comment
        if (attr.type === "null") {
            return `text /* nullable */`;
        }
        // Fallback to typeMap
        return typeMap[attr.type] || 'text';
    }

    // Build columns
    const attributes = collectionData.attributes || {};
    let columns = Object.entries(attributes).map(([key, attr]) => {
        let colType = processAttr(attr, key);
        // Add comment for nullable fields (if not already handled)
        let comment = '';
        if (attr.nullable && !colType.includes('nullable')) {
            comment = ' /* nullable */';
        }
        return { key, col: `    "${key}" ${colType}${comment}` };
    });

    // Find primary key
    let primaryKeyEntry = Object.entries(attributes).find(([_, attr]) => attr.isKey)
        || Object.entries(attributes).find(([key]) => key.toLowerCase() === "id");

    let pk;
    let columnsStrings = columns.map(c => c.col);

    let pkKey;
    if (primaryKeyEntry) {
        pkKey = primaryKeyEntry[0];
        pk = `"${pkKey}"`;
    } else {
        // No attributes at all, or no suitable PK: add a new field
        const autoId = `${collectionName}_id`;
        pkKey = autoId;
        columnsStrings.push(`    "${autoId}" uuid /* auto-generated PK */`);
        pk = `"${autoId}"`;
    }

    // If no attribute is called "id", but there are attributes, and none are isKey/required, add autoId
    if (
        Object.keys(attributes).length > 0 &&
        !Object.keys(attributes).some(k => k.toLowerCase() === "id") &&
        !Object.entries(attributes).some(([_, attr]) => attr.isKey)
    ) {
        const autoId = `${collectionName}_id`;
        pkKey = autoId;
        columnsStrings.push(`    "${autoId}" uuid /* auto-generated PK */`);
        pk = `"${autoId}"`;
    }

    // Move the PK column to the top for clarity
    const pkIndex = columnsStrings.findIndex(col => col.trim().startsWith(`"${pkKey}" `));
    if (pkIndex > 0) {
        const [pkCol] = columnsStrings.splice(pkIndex, 1);
        columnsStrings.unshift(pkCol);
    }

    const tableRef = `"${effectiveKeyspace}".${`"${collectionName}"`}`;

    // Compose final CQL: UDTs first, then table
    return (
`${udtDefs.length ? udtDefs.join('\n\n') + '\n\n' : ''}CREATE TABLE IF NOT EXISTS ${tableRef}(
${columnsStrings.join(',\n')},
    PRIMARY KEY (${pk})
);`
    );
}

const ExportComponent = () => {
    const { schema } = useContext(SchemaContext);
    const [selectedDB, setSelectedDB] = useState(null);
    const [selectedCollection, setSelectedCollection] = useState(null);
    const [cql, setCql] = useState('');
    const [keyspace, setKeyspace] = useState('');

    const handleCopy = () => {
        navigator.clipboard.writeText(cql);
    };

    const handleCassandraSelect = (collectionName, keyspaceValue) => {
        setSelectedCollection(collectionName);
        const cqlCode = generateCQL(collectionName, schema.collections[collectionName], keyspaceValue);
        setCql(cqlCode);
    };

    const handleDownload = () => {
        const blob = new Blob([cql], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${selectedCollection}.cql`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleMongoExport = (collectionName) => {
        const collectionData = schema.collections[collectionName];

        const documents = [
            Object.fromEntries(
                Object.entries(collectionData.attributes).map(([key, attr]) => {
                    let exampleValue = null;
                    switch (attr.type) {
                        case 'string': exampleValue = 'example'; break;
                        case 'number': exampleValue = 0; break;
                        case 'boolean': exampleValue = true; break;
                        case 'date': exampleValue = new Date().toISOString(); break;
                        case 'array': exampleValue = []; break;
                        case 'object': exampleValue = {}; break;
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
        <div className="flex flex-col items-center p-4 bg-gray-900 text-white min-h-screen w-full">
            <h2 className='text-xl font-bold mb-4 text-center'>Choose Export Target</h2>
            <div className="flex space-x-6 mb-6">
                <div onClick={() => setSelectedDB('mongodb')} className="cursor-pointer border rounded p-4 shadow hover:bg-gray-800">
                    <p className='text-lg font-semibold text-center'>MongoDB</p>
                </div>
                <div onClick={() => setSelectedDB('cassandra')} className="cursor-pointer border rounded p-4 shadow hover:bg-gray-800">
                    <p className='text-lg font-semibold text-center'>Cassandra</p>
                </div>
                <div onClick={() => setSelectedDB('firebase')} className="cursor-pointer border rounded p-4 shadow hover:bg-gray-800">
                    <p className='text-lg font-semibold text-center'>Firebase (Raw JSON)</p>
                </div>
            </div>

            {selectedDB === 'mongodb' && (
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
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 border-b-4 border-green-800 shadow"
                    >
                        Download Full Schema JSON
                    </button>
                </div>
            )}

            {selectedDB === 'cassandra' && (
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
