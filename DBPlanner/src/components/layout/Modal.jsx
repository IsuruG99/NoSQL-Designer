import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { SchemaContext } from '../../context/SchemaContext';

const Modal = ({ isOpen, onClose, children }) => {
    const [activeTab, setActiveTab] = useState('Editor');
    const [suggestion, setSuggestion] = useState('');
    const [loading, setLoading] = useState(false);

    const { selectedEntity, schema } = useContext(SchemaContext);

    if (!isOpen) return null;

    const handleAnalyze = async () => {
        if (!selectedEntity || !selectedEntity.name) return;

        if (!isOpen) {
            console.warn("Modal is not open, cannot analyze entity.");
            return;
        }

        setLoading(true);
        setSuggestion('');

        try {
            const startTime = performance.now();
            console.log("Starting analysis for entity:", selectedEntity.name);
            //send only the collections part from schema
            console.log("Full schema context:", JSON.stringify(schema.collections, null, 2));

            const response = await fetch("http://127.0.0.1:8000/analyze-entity", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: selectedEntity.name,
                    entity: selectedEntity,
                    collections: schema.collections
                }),
            });

            const endTime = performance.now();
            console.log(`Analyze API took ${Math.round(endTime - startTime)}ms`);

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();
            setSuggestion(data.suggestion || 'No suggestion returned.');
        } catch (error) {
            console.error("Analyze error:", error);
            setSuggestion(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="flex items-center justify-center w-full h-full max-w-5xl">
                <div className="cardFrame relative bg-gray-900 rounded-lg shadow-lg max-w-3xl w-full mx-4 border border-black max-h-[90vh] min-h-[50vh] overflow-hidden">

                    {/* Tab bar with Close button */}
                    <div className="flex justify-between items-center border-b border-gray-700 px-4 py-2">
                        <div className="flex space-x-4">
                            {['Editor', 'Suggestions'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`text-sm font-medium ${activeTab === tab
                                        ? 'text-cyan-400 border-b-2 border-cyan-400'
                                        : 'text-gray-400 hover:text-cyan-300'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={onClose}
                            title="Close"
                            className="text-gray-400 hover:text-white transition"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Modal content */}
                    <div className="flex flex-col h-full p-4 overflow-y-auto max-h-[calc(85vh-3rem)] w-full">
                        {activeTab === 'Editor' ? (
                            <div className="flex-1 w-full">
                                {children}
                            </div>
                        ) : (
                            <div className="flex flex-col w-full h-full">
                                <button
                                    onClick={handleAnalyze}
                                    disabled={loading || !selectedEntity?.name}
                                    className="mb-4 self-start px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                                >
                                    {loading ? 'Analyzing...' : 'Analyze'}
                                </button>
                                <textarea
                                    readOnly
                                    className="flex-1 bg-gray-800 text-gray-300 p-2 rounded w-full border border-gray-700 resize-none custom-scrollbar"
                                    placeholder="Analysis will appear here..."
                                    value={suggestion}
                                    rows={15}
                                />

                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Modal;
