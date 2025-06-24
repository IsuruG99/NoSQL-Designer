import React from 'react';
import AdvCard from './components/advCard.jsx';

function AdvPanel({ schema, loading, elapsedTime, onEdit, onAdd }) {
  return (
    <div className="panel flex flex-col p-4 min-h-screen h-full mx-10 mt-10">
      <h2 className="text-white text-xl mb-2 text-center">Drawing Panel</h2>
      {loading ? (
        <p className="text-white">⏳ Waiting for backend... {elapsedTime} sec elapsed</p>
      ) : (
        <>
          {schema?.collections && typeof schema.collections === 'object' ? (
            <div className="panel__output grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 place-items-center items-fit w-full">
              {Object.keys(schema.collections).map((key, index) => (
                <AdvCard key={index} entity={schema.collections[key]} onEdit={onEdit} />
              ))}
              <div
                onClick={onAdd}
                className="json-card p-4 bg-gray-800 text-white rounded-lg shadow-lg min-w-[220px] min-h-[300px] border border-dotted border-gray-500 flex items-center justify-center cursor-pointer"
              >
                <span className="add-card text-7xl text-cyan-400">+</span>
              </div>
            </div>
          ) : (
            <div className="flex rounded-lg items-center justify-center border border-gray-700 p-4 w-full text-center text-gray-500 h-64">
              <div>No schema available. <br /> Please generate a schema to view details.</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AdvPanel;