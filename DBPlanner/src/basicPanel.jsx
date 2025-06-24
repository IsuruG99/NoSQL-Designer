import React from 'react';
import JsonCard from './components/basicCard.jsx';

function Panel({ schema, loading, elapsedTime }) {
    const collections = schema?.collections || null;

    return (
        <div className="panel flex flex-col h-full mt-5">
            <h2 className="text-white text-xl mb-2 text-center">Drawing Panel</h2>
            {loading ? (
                <p className="text-white">⏳ Waiting for backend... {elapsedTime} sec elapsed</p>
            ) : (
                collections && typeof collections === 'object' ? (
                    <div className="panel__output grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 xl:gap-20 place-items-center mt-5">
                        {Object.entries(collections).map(([name, collection], index) => (
                            <JsonCard key={index} entity={collection} />
                        ))}
                    </div>
                ) : (
                    <div className="flex rounded-lg items-center justify-center border border-gray-700 p-4 w-full text-center text-gray-500 h-64">
                        <div>No schema available.  <br />  Please generate a schema to view details.</div>
                    </div>
                )
            )}
        </div>
    );
}

export default Panel;
