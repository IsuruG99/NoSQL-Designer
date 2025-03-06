import React, { useContext, useState } from 'react';
import { SchemaContext } from './SchemaContext.jsx';
import AdvPanel from './advPanel.jsx';
import EditableCard from './components/editCard.jsx';
import Modal from './components/Modal.jsx';

const Editor = () => {
    const { schema, selectedEntity } = useContext(SchemaContext);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);

    return (
        <div className="flex flex-col items-center w-full">
            <div className="editor w-full max-w-3xl space-y-4">
                {selectedEntity && (
                    <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
                        <EditableCard />
                    </Modal>
                )}
            </div>
            <AdvPanel schema={schema} loading={false} elapsedTime={0} onEdit={handleOpenModal} className="w-full" />
        </div>
    );
};

export default Editor;