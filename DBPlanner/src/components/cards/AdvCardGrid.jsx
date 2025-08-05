import React, { useContext } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import AdvCard from './advCard';
import { SchemaContext } from '../../context/SchemaContext';

/**
 * SortableAdvCard wraps AdvCard to provide drag-and-drop support using @dnd-kit.
 *
 * @param {object} props
 * @param {object} props.entity - Entity data to render.
 * @param {function} props.onEdit - Callback when editing is triggered.
 * @param {string} props.id - Unique id for dnd context.
 */
function SortableAdvCard({ entity, onEdit, id }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    return (
        // This div is the draggable card
        <div
            ref={setNodeRef}
            style={{
                transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
                transition,
                opacity: isDragging ? 0.7 : 1,
            }}
            className="relative">
            <AdvCard entity={entity} onEdit={onEdit} dragHandleprops={{...attributes, ...listeners }}/>
        </div>
    );
}

/**
 * AdvCardGrid renders a sortable grid of entities using @dnd-kit sortable context.
 *
 * @param {object} props
 * @param {Array} props.entities - List of entities to display.
 * @param {function} props.onEdit - Callback passed down to cards.
 */
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
                strategy={rectSortingStrategy}>
                {entities.map(entity => (
                    <SortableAdvCard
                        key={entity.name}
                        id={entity.name}
                        entity={entity}
                        onEdit={onEdit}/>
                ))}
            </SortableContext>
        </DndContext>
    );
}

export default AdvCardGrid;