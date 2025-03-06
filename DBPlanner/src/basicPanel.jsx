import React from 'react';
import JsonCard from './components/basicCard.jsx';

function Panel({ schema, loading, elapsedTime }) {
    return (
        <div className="panel flex flex-col p-4 h-full w-full mt-5 mx-20">
            <h2 className="text-white text-xl mb-2 text-center">Drawing Panel</h2>
            {loading ? (
                <p className="text-white">⏳ Waiting for backend... {elapsedTime} sec elapsed</p>
            ) : (
                schema && typeof schema === 'object' ? (
                    <div className="panel__output grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 place-items-center items-fit w-full">
                        {Object.keys(schema).map((key, index) => (
                            <JsonCard key={index} entity={schema[key]} />
                        ))}
                    </div>
                ) : (
                    <div className="flex rounded-lg items-center justify-center border border-gray-700 p-4 w-full text-center text-gray-500 h-64">
                        <div>No schema available. Please generate a schema to view details.</div>
                    </div>
                )
            )}
        </div>
    );
}

export default Panel;