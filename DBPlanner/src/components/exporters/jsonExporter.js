import { getFirebaseExport } from './firebaseExporter.js';
import { validateFirebaseExport, formatValidationErrors } from '../../utils/jsonValidator';

/**
 * Generate JSON export for normal or Firebase formats.
 * Validates schema before export.
 *
 * @param {object} schema - Full schema object.
 * @param {boolean} firebase - If true, output Firebase-ready JSON, else full schema export.
 * @returns {{ content: string, fileName: string, mimeType: string, errors?: string|null }} - Export data and optional validation errors.
 */
export function getJSONExport(schema, firebase = false) {
  // Validate the input schema first
  const validation = validateFirebaseExport(schema, schema);
  if (!validation.isValid) {
    return {
      content: '',
      fileName: firebase ? 'firebase-schema.json' : 'schema.json',
      mimeType: 'application/json',
      errors: formatValidationErrors(validation.errors)
    };
  }

  if (firebase) {
    // Remove $schema and $meta before Firebase conversion
    const cleanSchema = { collections: schema.collections };

    // Validate cleaned schema for Firebase export before generating output
    const firebaseValidation = validateFirebaseExport(cleanSchema, cleanSchema);
    if (!firebaseValidation.isValid) {
      return {
        content: '',
        fileName: 'firebase-schema.json',
        mimeType: 'application/json',
        errors: formatValidationErrors(firebaseValidation.errors)
      };
    }

    const firebaseData = getFirebaseExport(cleanSchema);
    return {
      content: JSON.stringify(firebaseData, null, 2),
      fileName: 'firebase-schema.json',
      mimeType: 'application/json',
      errors: null
    };
  } else {
    // Normal export includes $schema and $meta
    const { collections, $schema, $meta } = schema;
    const cleanSchema = {
      ...(!!$schema && { $schema }),
      ...(!!$meta && { $meta }),
      collections,
    };
    return {
      content: JSON.stringify(cleanSchema, null, 2),
      fileName: 'schema.json',
      mimeType: 'application/json',
      errors: null
    };
  }
}
