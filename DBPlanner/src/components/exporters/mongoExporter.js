/**
 * Generates a basic MongoDB export with placeholder document(s) 
 * based on a collection's attribute schema.
 *
 * @param {object} collectionData - Schema object for the collection, including attributes.
 * @param {string} collectionName - Name of the collection (used for file naming).
 * @returns {{ content: string, fileName: string, mimeType: string }} - JSON export object.
 */
export function getMongoExport(collectionData, collectionName) {
    const documents = [
        Object.fromEntries(
            Object.entries(collectionData.attributes).map(([key, attr]) => {
                let exampleValue = null;
                switch (attr.type) {
                    case 'string': exampleValue = 'example';
                    case 'number': exampleValue = 0;
                    case 'boolean': exampleValue = true;
                    case 'date': exampleValue = new Date().toISOString();
                    case 'array': exampleValue = [];
                    case 'object': exampleValue = {};
                    default: exampleValue = null;
                }
                return [key, exampleValue];
            })
        )
    ];

    return {
        content: JSON.stringify(documents, null, 2),
        fileName: `${collectionName}.json`,
        mimeType: 'application/json'
    };
}