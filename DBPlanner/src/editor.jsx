import React, { useContext } from 'react';
import { SchemaContext } from './SchemaContext.jsx';
import AdvPanel from './advPanel.jsx';
import EditableCard from './components/editCard.jsx';

const Editor = () => {
    const { schema, selectedEntity } = useContext(SchemaContext);

    return (
        <div className="flex flex-col items-center w-full">
            <div className="editor w-full max-w-3xl space-y-4">
                {selectedEntity && <EditableCard />}
            </div>
            <AdvPanel schema={schema} loading={false} elapsedTime={0} className="w-full" />
        </div>
    );
};

export default Editor;