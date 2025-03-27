import React, { useContext } from 'react';
import { SchemaContext } from './SchemaContext.jsx';

const ExportComponent = () => {
    const { schema } = useContext(SchemaContext);

    const downloadJSON = () => {
        const jsonString = JSON.stringify(schema, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = 'schema.json';
        link.click();
        URL.revokeObjectURL(url);
    };

    const downloadCQL = () => {
        let cqlString = '';
        
        // Create keyspace if not exists
        cqlString += `CREATE KEYSPACE IF NOT EXISTS dbplanner\n`;
        cqlString += `WITH replication = {\n`;
        cqlString += `  'class': 'SimpleStrategy',\n`;
        cqlString += `  'replication_factor': 1\n`;
        cqlString += `};\n\n`;
        
        // Use the keyspace
        cqlString += `USE dbplanner;\n\n`;
        
        // Generate CQL for each entity
        Object.values(schema).forEach(entity => {
            // Create table
            cqlString += `CREATE TABLE IF NOT EXISTS ${entity.Name.toLowerCase()} (\n`;
            
            // Add columns
            const columns = Object.entries(entity.Attributes).map(([key, value]) => {
                let type = value.type;
                // Map our types to Cassandra types
                switch(value.type) {
                    case 'string': type = 'text'; break;
                    case 'number': type = 'int'; break;
                    case 'boolean': type = 'boolean'; break;
                    case 'timestamp': type = 'timestamp'; break;
                    case 'array': type = 'list<text>'; break;
                    case 'object': type = 'map<text, text>'; break;
                    case 'binary': type = 'blob'; break;
                    case 'map': type = 'map<text, text>'; break;
                    default: type = 'text';
                }
                return `  ${key.toLowerCase()} ${type}`;
            });
            
            cqlString += columns.join(',\n');
            
            // Add partition key (using first column as partition key)
            if (columns.length > 0) {
                const firstColumn = columns[0].split(' ')[0];
                cqlString += `,\n  PRIMARY KEY ((${firstColumn}))`;
            }
            
            cqlString += '\n);\n\n';
        });

        const blob = new Blob([cqlString], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = 'schema.cql';
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
                    JSON
                </button>
                <button
                    onClick={downloadCQL}
                    className="px-4 py-2 text-white rounded bg-green-600 hover:bg-green-700 border-green-800 border-b-3"
                >
                    CQL
                </button>
            </div>
        </div>
    );
};

export default ExportComponent;