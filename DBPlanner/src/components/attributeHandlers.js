// Data type constants
export const DATA_TYPES = [
    "string",
    "number",
    "boolean",
    "date",
    "array",
    "object",
    "null"
];

export const STORAGE_OPTIONS = [
    "embedded",
    "normalized"
];

// Attribute type handlers
const TYPE_HANDLERS = {
    string: { getDefault: () => ({ type: "string", required: false, examples: [] }) },
    number: { getDefault: () => ({ type: "number", required: false, examples: [] }) },
    boolean: { getDefault: () => ({ type: "boolean", required: false, examples: [] }) },
    date: { getDefault: () => ({ type: "date", required: false, examples: [] }) },
    array: { getDefault: () => ({ type: "array", required: false, storage: "embedded", properties: {} }) },
    object: { getDefault: () => ({ type: "object", required: false, storage: "embedded", properties: {} }) },
    null: { getDefault: () => ({ type: "null", required: false }) }
};

// Removes unnecessary keys based on the type of attribute
const trimAttribute = (attribute) => {
    if (!attribute || typeof attribute !== 'object') {
        console.error("Invalid attribute:", attribute);
        return attribute;
    }
    if (['array', 'object', 'null'].includes(attribute.type)) {
        delete attribute.isKey;
    }
    const allowedKeysByType = {
        string: ["type", "required", "isKey", "default", "examples"],
        number: ["type", "required", "isKey", "default", "examples"],
        boolean: ["type", "required", "isKey", "default", "examples"],
        date: ["type", "required", "isKey", "default", "examples"],
        array: ["type", "required", "structure", "items", "default"],
        object: ["type", "required", "structure", "properties", "default"],
        null: ["type", "required"]
    };

    const type = attribute.type || "string";
    const allowed = new Set(allowedKeysByType[type]);

    return Object.fromEntries(
        Object.entries(attribute).filter(([key]) => allowed.has(key))
    );
};

// Normalizes the attribute to ensure it has the correct structure and properties
export const normalizeAttribute = (attribute) => {
    if (!attribute || typeof attribute !== 'object') {
        console.error("Invalid attribute:", attribute);
        return attribute;
    }
    attribute = trimAttribute(attribute);

    // Shared defaults
    if (attribute.required === undefined) attribute.required = false;
    if (attribute.examples === undefined && ["string", "number", "boolean", "date"].includes(attribute.type)) {
        attribute.examples = [];
    }

    switch (attribute.type) {
        case "array":
            if (!attribute.structure) attribute.structure = "embedded";
            if (!attribute.items) attribute.items = { type: "string", required: false, examples: [] };
            break;
        case "object":
            if (!attribute.structure) attribute.structure = "embedded";
            if (!attribute.properties) attribute.properties = {};
            break;
    }

    return attribute;
};

// Checks if the selected key path is valid and if only one field is marked as isKey
export const validateIsKey = (attributes, selectedKeyPath) => {
    let keyCount = 0;
    const traverse = (obj, path = "", isRoot = true) => {
        for (const key in obj) {
            const attr = obj[key];
            if (!attr || typeof attr !== "object") continue;

            const currentPath = path ? `${path}.${key}` : key;

            // Only allow isKey at the root level, and ignore the one we're toggling
            if (isRoot && attr.isKey === true && currentPath !== selectedKeyPath) {
                keyCount++;
            }

            if (attr.type === "object" && attr.properties) {
                traverse(attr.properties, currentPath, false);
            }
        }
    };
    traverse(attributes); // Start traversal from the root
    if (keyCount > 0) {
        return { valid: false, reason: "Only one field can be marked as isKey." };
    }

    return { valid: true };
};

// Returns the appropriate handler for the given type
export const getTypeHandler = (type) => TYPE_HANDLERS[type] || TYPE_HANDLERS.string;

// Creates a new attribute with the default values for the given type
export const createAttribute = (type, isNested = false) => {
    const attribute = getTypeHandler(type).getDefault();
    if (isNested && (type === 'object' || type === 'array')) {
        attribute.properties = {};
        if(type === 'array' && !attribute.items) {
            attribute.items = { type: "string", required: false, examples: [] };
        }
    }
    return attribute;
};

// Updates an attribute in the current attributes object based on the keyPath and field
export const updateAttribute = (currentAttributes, keyPath, field, value) => {
    const keys = keyPath.split('.');
    const updatedAttributes = JSON.parse(JSON.stringify(currentAttributes));
    let current = updatedAttributes;

    for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
            current[keys[i]] = createAttribute('object');
        }
        current = current[keys[i]];
        // Only step into .properties if the next key is not 'properties'
        if (current.properties && keys[i + 1] !== 'properties') {
            current = current.properties;
        }
    }

    const finalKey = keys[keys.length - 1];

    // Event handlers for different fields
    if (field === 'type') {
        current[finalKey] = createAttribute(value, keyPath.includes('.'));
        current[finalKey] = normalizeAttribute(current[finalKey]);
    } else if (field === 'rename') {
        const attr = current[finalKey];
        const newObj = {};
        Object.keys(current).forEach((k) => {
            if (k === finalKey) {
                newObj[value] = normalizeAttribute(attr);
            } else {
                newObj[k] = current[k];
            }
        });
        Object.keys(current).forEach(k => delete current[k]);
        Object.assign(current, newObj);
    } else if (field === 'isKey') {
        if (current[finalKey].isKey) {
            current[finalKey].isKey = false;
        } else {
            const validation = validateIsKey(updatedAttributes, keyPath);
            if (validation.valid) {
                current[finalKey].isKey = true;
            } else {
                console.error(validation.reason);
                return updatedAttributes;
            }
        }
    } else if (field === 'delete') {
        delete current[finalKey];
    } else {
        current[finalKey][field] = value;
        current[finalKey] = normalizeAttribute(current[finalKey]);
    }
    return updatedAttributes;
};
