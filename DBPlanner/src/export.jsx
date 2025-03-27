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

    return (
        <div className='w-full max-w-2xl space-y-4 '
        >
            <h1 className='text-3xl font-bold text-center mb-4'>Export Format</h1>
            <div className='flex justify-around w-full p-4 m-4 items-center space-x-4'>
                <button
                    onClick={downloadJSON}
                    className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded border-b-3 border-blue-700'>
                    JSON
                </button>
                <button
                    className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded border-b-3 border-blue-700'>
                    BSON
                </button>
                <button
                    className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded border-b-3 border-blue-700'>
                    CQL
                </button>
            </div>
        </div>
    );
};

export default ExportComponent;