/**
 * Converts a validated Draft-07-like schema into Firebase-ready sample JSON.
 * Extracts one example document per collection using `examples` in attributes.
 * 
 * @param {object} schema - Validated schema with `collections`.
 * @returns {object} - Simple { collectionName: sampleDocument } map.
 */
export function getFirebaseExport(schema) {
  if (!schema.collections) return {};
  const result = {};

  for (const [colName, colData] of Object.entries(schema.collections)) {
    const sampleDoc = {};
    const attrs = colData.attributes || {};

    for (const [attrName, attrData] of Object.entries(attrs)) {
      if (attrData.type === 'object' && attrData.properties) {
        sampleDoc[attrName] = extractSampleObject(attrData.properties);
      } else if (attrData.type === 'array' && attrData.items) {
        if (attrData.items.type === 'object' && attrData.items.properties) {
          sampleDoc[attrName] = [extractSampleObject(attrData.items.properties)];
        } else if (attrData.items.examples) {
          sampleDoc[attrName] = [attrData.items.examples[0]];
        } else {
          sampleDoc[attrName] = [];
        }
      } else if (attrData.examples && attrData.examples.length > 0) {
        sampleDoc[attrName] = attrData.examples[0];
      } else {
        sampleDoc[attrName] = dummyValueForType(attrData.type);
      }
    }
    
    // Use the first example ID if available, otherwise default to "sample1"
    const idAttr = Object.entries(attrs).find(([k, v]) => k.toLowerCase().endsWith("id"));
    const docId = idAttr && idAttr[1].examples ? idAttr[1].examples[0] : "sample1";
    result[colName] = { [docId]: sampleDoc };
  }

  return result;
}

/** Helper: extract sample from nested properties */
function extractSampleObject(properties) {
  const obj = {};
  for (const [key, val] of Object.entries(properties)) {
    if (val.type === 'object' && val.properties) {
      obj[key] = extractSampleObject(val.properties);
    } else if (val.type === 'array' && val.items) {
      if (val.items.type === 'object' && val.items.properties) {
        obj[key] = [extractSampleObject(val.items.properties)];
      } else if (val.items.examples) {
        obj[key] = [val.items.examples[0]];
      } else {
        obj[key] = [];
      }
    } else if (val.examples && val.examples.length > 0) {
      obj[key] = val.examples[0];
    } else {
      obj[key] = dummyValueForType(val.type);
    }
  }
  return obj;
}

/** Helper: fallback dummy values */
function dummyValueForType(type) {
  switch (type) {
    case 'string': return '';
    case 'number': return 0;
    case 'boolean': return false;
    case 'date': return new Date().toISOString();
    case 'array': return [];
    case 'object': return {};
    default: return null;
  }
}
