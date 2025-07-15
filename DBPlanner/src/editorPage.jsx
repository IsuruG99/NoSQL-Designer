import React, { useContext, useState } from 'react';
import { SchemaContext } from './context/SchemaContext.jsx';
import AdvPanel from './components/layout/advPanel.jsx';
import EditableCard from './components/cards/editCard.jsx';
import Modal from './components/layout/Modal.jsx';

const Editor = () => {
    const { schema, selectedEntity, setOriginalSelectedEntity, setTempSelectedEntity } = useContext(SchemaContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isNewCard, setIsNewCard] = useState(false);

    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setOriginalSelectedEntity(null);
        setTempSelectedEntity(null);
        setIsNewCard(false);
    };

    const handleAddCard = () => {
        setTempSelectedEntity({ Name: '', Attributes: {} });
        setIsNewCard(true);
        handleOpenModal();
    };

    return (
        <div className="flex flex-col items-center w-full min-h-screen h-full">
            <div className="editor w-full max-w-4xl space-y-4 h-full">
                {selectedEntity && (
                    <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
                        <EditableCard handleCloseModal={handleCloseModal} isNewCard={isNewCard} />
                    </Modal>
                )}
            </div>
            <AdvPanel schema={schema} loading={false} elapsedTime={0} onEdit={handleOpenModal} onAdd={handleAddCard} className="w-full" />
        </div>
    );
};

export default Editor;