import React, { useState, useEffect } from 'react';
import JsonCard from './components/basicCard.jsx';

function Panel({ schema, loading, elapsedTime }) {
    const [columns, setColumns] = useState(1);

    useEffect(() => {
        const updateColumns = () => {
            const screenWidth = window.innerWidth;
            const cardWidth = screenWidth * 0.05;
            const maxColumns = Math.floor(screenWidth / cardWidth);
            setColumns(Math.max(1, maxColumns));
        };

        updateColumns();
        window.addEventListener('resize', updateColumns);
        return () => window.removeEventListener('resize', updateColumns);
    }, []);

    return (
        <div className="panel flex flex-col p-4 w-full">
            <h2 className="text-white text-xl mb-2">Drawing Panel</h2>
            {loading ? (
                <p className="text-white">⏳ Waiting for backend... {elapsedTime} sec elapsed</p>
            ) : (
                schema && typeof schema === 'object' ? (
                    <div className="panel__output grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 place-items-center items-fit">
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