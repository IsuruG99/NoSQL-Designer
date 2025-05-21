import React from 'react';

const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;

    const handleClose = () => {
        onClose();
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70">
            <div className="flex items-center justify-center w-full h-full max-w-5xl">
                <div className="cardFrame justify-center items-center relative bg-gray-900 rounded-lg shadow-lg max-w-3xl w-full mx-4 border border-black max-h-[90vh]">
                    <button onClick={handleClose} className="absolute top-5 right-7 text-gray-300 hover:text-gray-200 text-2xl">
                        &times;
                    </button>
                    <div className="flex flex-col items-center justify-center h-full p-4">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Modal;