import React, { useContext } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import AdvCard from './advCard';
import { SchemaContext } from '../SchemaContext';

function SortableAdvCard({ entity, onEdit, id }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    return (
        <div
            ref={setNodeRef}
            style={{
                transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
                transition,
                opacity: isDragging ? 0.7 : 1,
            }}
            className="relative"
        >
            
            <AdvCard entity={entity} onEdit={onEdit} dragHandleprops={{...attributes, ...listeners }}
            />
        </div>
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
            setEntities(newEntities);
        }
    };

    return (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
                items={entities.map(e => e.name)}
                strategy={rectSortingStrategy}
            >
                {entities.map(entity => (
                    <SortableAdvCard
                        key={entity.name}
                        id={entity.name}
                        entity={entity}
                        onEdit={onEdit}
                    />
                ))}
            </SortableContext>
        </DndContext>
    );
}

export default AdvCardGrid;