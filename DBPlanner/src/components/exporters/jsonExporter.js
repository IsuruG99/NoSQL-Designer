/**
 * Generate a clean Firebase-compatible JSON export of the schema.
 * Removes UI-specific fields like `entities` and transient selections.
 *
 * @param {object} schema - The full schema object from context or storage.
 * @returns {{ content: string, fileName: string, mimeType: string }} - JSON string, filename, and MIME type for export.
 */
export function getFirebaseExport(schema) {
    const { collections, $schema, $meta, exportOptions } = schema;

    const cleanSchema = {
        ...(!!$schema && { $schema }),
        ...(!!$meta && { $meta }),
        collections,
        ...(!!exportOptions && { exportOptions }),
    };

    return {
        content: JSON.stringify(cleanSchema, null, 2),
        fileName: 'schema.json',
        mimeType: 'application/json'
    };
}