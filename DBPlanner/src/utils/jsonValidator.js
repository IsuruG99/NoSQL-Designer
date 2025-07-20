import Ajv from 'ajv';

/**
 * Initializes AJV validator with common configurations
 * @returns {Ajv} Configured AJV instance
 */
const initValidator = () => {
  const ajv = new Ajv({
    allErrors: true,        // Show all errors
    strict: false,          // Be more forgiving with schema
    coerceTypes: true       // Try to coerce types when possible
  });
  ajv.addFormat('email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  ajv.addFormat('uri', /^https?:\/\/\S+$/);          // Add support for format validation (date, email, etc.)
  return ajv;
};

const convertMongoSchemaToJSONSchema = (mongoSchema) => {
  const properties = {};
  const required = [];

  Object.entries(mongoSchema.attributes).forEach(([key, attr]) => {
    let propSchema = {};

    // Convert 'date' to string + format
    if (attr.type === 'date') {
      propSchema = {
        type: 'string',
        format: 'date-time'
      };
    } else if (attr.type === 'array') {
      const items = attr.items || {};
      let itemsSchema = {};

      if (items.type === 'object') {
        itemsSchema = {
          type: 'object',
          properties: convertNestedProps(items.properties || {}),
          required: getRequiredFields(items.properties || [])
        };
      } else {
        itemsSchema = { type: items.type || 'string' };
      }

      propSchema = {
        type: 'array',
        items: itemsSchema
      };
    } else if (attr.type === 'object') {
      propSchema = {
        type: 'object',
        properties: convertNestedProps(attr.properties || {}),
        required: getRequiredFields(attr.properties || [])
      };
    } else {
      propSchema = { type: attr.type };
    }

    // Optional: include example
    if (attr.examples?.length) {
      propSchema.examples = attr.examples;
    }

    properties[key] = propSchema;

    if (attr.required) {
      required.push(key);
    }
  });

  return {
    type: 'array',
    items: {
      type: 'object',
      properties,
      required
    }
  };
};

const convertNestedProps = (props) => {
  const result = {};
  for (const [key, prop] of Object.entries(props)) {
    result[key] = prop.type === 'date'
      ? { type: 'string', format: 'date-time' }
      : prop.type === 'object'
        ? {
            type: 'object',
            properties: convertNestedProps(prop.properties || {}),
            required: getRequiredFields(prop.properties || [])
          }
        : prop.type === 'array'
          ? {
              type: 'array',
              items: prop.items ? { type: prop.items.type || 'string' } : {}
            }
          : { type: prop.type };
    if (prop.examples?.length) {
      result[key].examples = prop.examples;
    }
  }
  return result;
};

const getRequiredFields = (props) => {
  return Object.entries(props || {})
    .filter(([_, prop]) => prop.required)
    .map(([key]) => key);
};


/**
 * Validates MongoDB export data
 * @param {array} documents - Array of MongoDB documents
 * @param {object} mongoSchema - Original MongoDB schema
 * @returns {object} Validation result
 */
export const validateMongoExport = (documents, mongoSchema) => {
  const ajv = initValidator();
  const jsonSchema = convertMongoSchemaToJSONSchema(mongoSchema);
  const validate = ajv.compile(jsonSchema);
  const isValid = validate(documents);

  console.log(JSON.stringify(jsonSchema, null, 2))

  return {
    isValid,
    errors: isValid ? null : validate.errors,
    schema: jsonSchema // For debugging
  };
};


/**
 * Validates complete Firebase export against the full schema
 * @param {object} firebaseData - The complete Firebase data to validate
 * @param {object} fullSchema - The complete JSON schema
 * @returns {object} Validation result { isValid: boolean, errors: array|null }
 */
export const validateFirebaseExport = (firebaseData, fullSchema) => {
  const ajv = initValidator();
  const validate = ajv.compile(fullSchema);
  const isValid = validate(firebaseData);
  
  return {
    isValid,
    errors: isValid ? null : validate.errors
  };
};

/**
 * Formats validation errors for display
 * @param {array} errors - AJV validation errors
 * @returns {string} Formatted error message
 */
export const formatValidationErrors = (errors) => {
  return errors.map(err => {
    const path = err.instancePath ? `at path '${err.instancePath}'` : 'in root object';
    return `Error ${path}: ${err.message}. Value: ${JSON.stringify(err.data)}`;
  }).join('\n');
};