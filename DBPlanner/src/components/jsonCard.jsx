import React from 'react';
import './jsonCard.css';

function JsonCard({ entity }) {
    return (
        <div className="json-card">
            <h3>{entity.Name}</h3> {/* Using Name from the entity */}
            <hr />
            <ul>
                {Object.entries(entity.Attributes).map(([key, value]) => (
                    <li key={key}>
                        <strong>{key}:</strong> {value}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default JsonCard;
