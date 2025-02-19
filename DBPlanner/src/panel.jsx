import React from 'react';
import './panel.css';
import JsonCard from './components/jsonCard.jsx';

function Panel({ schema, loading, elapsedTime }) {
    return (
        <div className="panel" style={{ display: "flex", flexDirection: "column" }}> 
            <div className="panel__input">
                <h2>Drawing Panel</h2>
            </div>
            <div className="panel__output">
                {loading ? (
                    <p>⏳ Waiting for backend... {elapsedTime} sec elapsed</p>
                ) : (
                    schema ? (
                        Object.keys(schema).map((key, index) => (
                            console.log("Processing entity:", schema[key]),
                            <JsonCard key={index} entity={schema[key]} />
                        ))
                    ) : (                        
                        <pre>{JSON.stringify(schema, null, 2)}</pre>
                    )
                )}
            </div>
        </div>
    );
}

export default Panel;