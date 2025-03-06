import React from 'react';

const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="flex items-center justify-center w-full h-full">
                <div className="relative bg-white rounded-lg shadow-lg max-w-lg w-auto mx-4 border border-gray-200">
                    <button onClick={onClose} className="absolute top-2 right-2 text-gray-300 hover:text-gray-200 text-2xl">
                        &times;
                    </button>
                    <div className="flex items-center justify-center h-full">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Modal;