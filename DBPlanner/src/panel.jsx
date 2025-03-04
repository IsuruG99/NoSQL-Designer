import React from 'react';
import JsonCard from './components/jsonCard.jsx';

function Panel({ schema, loading, elapsedTime }) {
    return (
        <div className="panel flex flex-col p-4 w-full">
            <div className="panel__input">
                <h2 className="text-white text-xl mb-2">Drawing Panel</h2>
            </div>
            <div className="panel__output grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 place-items-start">
                {loading ? (
                    <p className="text-white">⏳ Waiting for backend... {elapsedTime} sec elapsed</p>
                ) : (
                    schema && typeof schema === 'object' ? (
                        Object.keys(schema).map((key, index) => (
                            <JsonCard key={index} entity={schema[key]} />
                        ))
                    ) : (                        
                        <pre className="text-white">{JSON.stringify(schema, null, 2)}</pre>
                    )
                )}
            </div>
        </div>
    );
}

export default Panel;
