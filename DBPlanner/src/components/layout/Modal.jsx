import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { SchemaContext } from '../../context/SchemaContext';

/**
 * Modal overlay with Editor and Suggestions tabs.
 * Fetches and shows analysis for the selected entity.
 * Uses SchemaContext for entity and schema data.
 * 
 * @param isOpen - Controls modal visibility.
 * @param onClose - Callback to close the modal.
 * @param children - Content to render in the Editor tab.
 */
const Modal = ({ isOpen, onClose, children }) => {
    const [activeTab, setActiveTab] = useState('Editor');
    const [suggestion, setSuggestion] = useState('');
    const [loading, setLoading] = useState(false);
    const { selectedEntity, schema } = useContext(SchemaContext);

    if (!isOpen) return null;   // Don't render anything if modal is closed
    JSON.parseSafe = (str) => {
        try {
            return JSON.parse(str);
        } catch {
            return null;
        }
    };

    // Handle entity analysis
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
            const response = await fetch("http://127.0.0.1:8000/api/analyze-entity", {
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
                    {/* Header: 2 Tabs & Close */}
                    <div className="flex justify-between items-center border-b border-gray-700 px-4 py-2">
                        <div className="flex space-x-4">
                            {['Editor', 'Suggestions'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`text-sm font-medium ${activeTab === tab
                                        ? 'text-cyan-400 border-b-2 border-cyan-400'
                                        : 'text-gray-400 hover:text-cyan-300'
                                        }`}>
                                    {tab}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={onClose}
                            title="Close"
                            className="text-gray-400 hover:text-white transition">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Modal content */}
                    <div className="flex flex-col h-full p-4 overflow-y-auto max-h-[calc(85vh-3rem)] custom-scrollbar w-full">
                        {activeTab === 'Editor' ? (
                            <div className="flex-1 w-full">
                                {children}
                            </div>
                        ) : (
                            <div className="flex flex-col w-full h-full">
                                <button
                                    onClick={handleAnalyze}
                                    disabled={loading || !selectedEntity?.name}
                                    className="mb-4 self-start px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-600 disabled:opacity-50">
                                    {loading ? 'Analyzing...' : 'Analyze'}
                                </button>
                                <div className="flex-1 overflow-y-auto border border-gray-700 rounded bg-gray-800 p-3 custom-scrollbar space-y-6">
                                    {(() => {
                                        const parsed = suggestion; // already parsed JSON object from backend

                                        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                                            return <p className="text-gray-400 text-sm whitespace-pre-wrap">{suggestion}</p>;
                                        }
                                        return Object.entries(parsed)
                                            .filter(([, points]) => Array.isArray(points) && points.length > 0)
                                            .map(([category, points], idx) => (
                                                <div key={idx} className="mb-6">
                                                    <h3 className="text-cyan-400 text-lg font-semibold mb-2">{category}</h3>
                                                    <div className="max-h-40 overflow-y-auto custom-scrollbar bg-gray-800 p-3 rounded">
                                                        <ul className="list-disc pl-5 space-y-1 text-sm text-gray-200 font-medium">
                                                            {points.map((point, i) => (
                                                                <li key={i}>{point}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            ));
                                    })()}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Modal;
