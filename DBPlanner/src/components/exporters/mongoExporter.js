import { validateMongoExport, formatValidationErrors } from '../../utils/jsonValidator';

/**
 * Generates a basic MongoDB export with placeholder document(s) 
 * based on a collection's attribute schema.
 *
 * @param {object} collectionData - Schema object for the collection, including attributes.
 * @param {string} collectionName - Name of the collection (used for file naming).
 * @returns {{ content: string, fileName: string, mimeType: string }} - JSON export object.
 */
export function getMongoExport(collectionData, collectionName) {
    const idFields = Object.keys(collectionData.attributes).filter(
        key => key.toLowerCase().includes('id')
    );

    const getExampleValue = (key, attr, depth = 0) => {
        // Prevent infinite recursion
        if (depth > 3) return null;
        if (attr.examples && attr.examples.length > 0) {
            return attr.examples[0];
        }

        switch (attr.type) {
            case 'string':
                return key.toLowerCase().includes('email') ? 'example@email.com' :
                    key.toLowerCase().includes('phone') ? '555-123-4567' :
                        key.toLowerCase().includes('name') ? 'Example ' + key :
                            'example_' + key;

            case 'number':
                return key.toLowerCase().includes('price') ? 99.99 :
                    key.toLowerCase().includes('age') ? 25 :
                        0;

            case 'boolean':
                return true;

            case 'date':
                return { "$date": new Date().toISOString() };

            case 'array':
                if (attr.items) {
                    if (attr.items.type === 'object' && attr.items.properties) {
                        return [generateObjectExample(attr.items.properties, depth + 1)];
                    }
                    return [getExampleValue(key + '_item', attr.items, depth + 1)];
                }
                return [];

            case 'object':
                if (attr.properties) {
                    return generateObjectExample(attr.properties, depth + 1);
                }
                return {};

            default:
                return null;
        }
    };

    const generateObjectExample = (properties, depth) => {
        return Object.fromEntries(
            Object.entries(properties).map(([key, prop]) => {
                let value = getExampleValue(key, prop, depth);
                // Convert ObjectId strings to MongoDB ObjectId format
                if (key.toLowerCase().includes('id') && typeof value === 'string') {
                    if (/^[0-9a-f]{24}$/i.test(value)) {
                        value = `ObjectId("${value}")`;
                    }
                }

                return [key, value];
            })
        );
    };

    const documents = [generateObjectExample(collectionData.attributes, 0)];

    const validation = validateMongoExport(documents, collectionData);
    if (!validation.isValid) {
        const errorMessage = `MongoDB export validation failed for ${collectionName}:\n` +
            formatValidationErrors(validation.errors);
        console.error(errorMessage);
        throw new Error(errorMessage);
    }

    return {
        content: JSON.stringify(documents, null, 2),
        fileName: `${collectionName}.json`,
        mimeType: 'application/json',
        metadata: {
            indexSuggestions: idFields.map(field => ({
                collection: collectionName,
                fields: { [field]: 1 },
                options: { unique: true }
            })),
            validation: {
                valid: validation.isValid,
                ...(!validation.isValid && { errors: validation.errors })
            }
        }
    };
}