import React, { useContext } from 'react';
import AdvCardGrid from '../cards/AdvCardGrid.jsx';
import { SchemaContext } from '../../context/SchemaContext.jsx';
import { PlusIcon } from '@heroicons/react/24/solid';

/**
 * AdvPanel component - displays the drawing panel with schema cards.
 * Uses entities from SchemaContext to render cards grid.
 * 
 * Props:
 * @param {boolean} loading - Indicates if backend response is pending.
 * @param {number} elapsedTime - Seconds elapsed waiting for backend.
 * @param {function} onEdit - Callback when a card is edited.
 * @param {function} onAdd - Callback when "Add Card" is clicked.
 */
function AdvPanel({ loading, elapsedTime, onEdit, onAdd }) {
  const { entities } = useContext(SchemaContext);

  return (
    <div className="panel flex flex-col p-4 min-h-screen h-full mx-10 mt-10">
      <h2 className="text-white text-xl mb-2 text-center">Drawing Panel</h2>
      {loading ? (
        <p className="text-white">⏳ Waiting for backend... {elapsedTime} sec elapsed</p>
      ) : (
        <>
          {entities.length > 0 ? (
            <div className="panel__output w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 w-full auto-rows-min">

                {/* AdvCardGrid renders only the cards */}
                <AdvCardGrid entities={entities} onEdit={onEdit} />
                {/* Add Card button as a grid item */}
                <div
                  onClick={onAdd}
                  className="json-card p-4 bg-gray-800 text-white rounded-lg shadow-lg w-[220px] h-[300px] border border-dotted border-cyan-400 flex flex-col items-center justify-center cursor-pointer transition hover:bg-gray-700"
                  style={{ userSelect: 'none' }}
                  title="Add new card"
                >
                  <PlusIcon className="h-16 w-16 text-cyan-400 mb-2" />
                  <span className="text-cyan-300 font-medium text-lg">Add Card</span>
                </div>
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