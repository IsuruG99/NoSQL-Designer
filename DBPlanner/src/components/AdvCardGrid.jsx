import React, { useContext } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import AdvCard from './advCard';
import { SchemaContext } from '../SchemaContext';

function SortableAdvCard({ entity, onEdit, id }) {
    const { attributes, listeners, setNodeRef, isDragging } = useSortable({ id });
    return (
        <AdvCard
            entity={entity}
            onEdit={onEdit}
            attributes={attributes}
            listeners={listeners}
            setNodeRef={setNodeRef}
            isDragging={isDragging}
        />
    );
}

function AdvCardGrid({ entities, onEdit }) {
    const { setEntities } = useContext(SchemaContext);

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            const oldIndex = entities.findIndex(e => e.name === active.id);
            const newIndex = entities.findIndex(e => e.name === over.id);
            const newEntities = arrayMove(entities, oldIndex, newIndex);
            setEntities(newEntities); // Update SchemaContext with new order
        }
    };

    return (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
                items={entities.map(e => e.name)}
                strategy={verticalListSortingStrategy}
            >
                <div className="grid grid-cols-3 gap-4">
                    {entities.map(entity => (
                        <SortableAdvCard
                            key={entity.name}
                            id={entity.name}
                            entity={entity}
                            onEdit={onEdit}
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}

export default AdvCardGrid;