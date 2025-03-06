import React, { useContext, useState } from 'react';
import { SchemaContext } from './SchemaContext.jsx';
import AdvPanel from './advPanel.jsx';
import EditableCard from './components/editCard.jsx';
import Modal from './components/Modal.jsx';

const Editor = () => {
    const { schema, selectedEntity, setOriginalSelectedEntity, setTempSelectedEntity } = useContext(SchemaContext);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setOriginalSelectedEntity(null);
        setTempSelectedEntity(null);
    };

    return (
        <div className="flex flex-col items-center w-full min-h-screen h-full">
            <div className="editor w-full max-w-4xl space-y-4 h-full">
                {selectedEntity && (
                    <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
                        <EditableCard handleCloseModal={handleCloseModal} />
                    </Modal>
                )}
            </div>
            <AdvPanel schema={schema} loading={false} elapsedTime={0} onEdit={handleOpenModal} className="w-full" />
        </div>
    );
};

export default Editor;