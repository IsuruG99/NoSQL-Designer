// Data type constants
export const DATA_TYPES = [
    "string",
    "number",
    "boolean",
    "date",
    "array",
    "object",
    "enum", //in reality if this is selected we change to string and subtype to enum
    "null"
];

export const COMMON_VALIDATION_KEYS = [
    "pattern",
    "minLength",
    "maxLength",
    "min",
    "max",
    "enum"
];

export const STORAGE_OPTIONS = [
    "embedded",
    "normalized"
];

// Attribute type handlers
const TYPE_HANDLERS = {
    string: { getDefault: () => ({ type: "string", required: false, validation: {} }) },
    number: { getDefault: () => ({ type: "number", required: false, validation: {} }) },
    boolean: { getDefault: () => ({ type: "boolean", required: false, validation: {} }) },
    date: { getDefault: () => ({ type: "date", required: false, validation: {} }) },
    array: { getDefault: () => ({ type: "array", required: false, validation: {}, storage: "embedded", properties: {} }) },
    object: { getDefault: () => ({ type: "object", required: false, validation: {}, storage: "embedded", properties: {} }) },
    enum: { getDefault: () => ({ type: "enum", required: false, validation: {}, subtype: "enum", values: [] }) },
    null: { getDefault: () => ({ type: "null", required: false, validation: {} }) }
};

// This function removes unnecessary keys based on the type of attribute
const trimAttribute = (attribute) => {
    if (!attribute || typeof attribute !== 'object') {
        console.error("Invalid attribute:", attribute);
        return attribute;
    }
    if (['array', 'object', 'null'].includes(attribute.type)) {
        delete attribute.isKey;
    }
    const allowedKeysByType = {
        string: ["type", "required", "validation", "isKey", "default"],
        number: ["type", "required", "validation", "isKey", "default"],
        boolean: ["type", "required", "validation", "isKey", "default"],
        date: ["type", "required", "validation", "isKey", "default"],
        enum: ["type", "required", "subtype", "values", "validation", "isKey", "default"],
        array: ["type", "required", "structure", "items", "validation", "default"],
        object: ["type", "required", "structure", "properties", "validation", "default"],
        null: ["type", "required"]
    };

    const type = attribute.type || "string";
    const allowed = new Set(allowedKeysByType[type]);

    return Object.fromEntries(
        Object.entries(attribute).filter(([key]) => allowed.has(key))
    );
};

// This function normalizes the attribute to ensure it has the correct structure and properties
export const normalizeAttribute = (attribute) => {
    if (!attribute || typeof attribute !== 'object') {
        console.error("Invalid attribute:", attribute);
        return attribute;
    }
    attribute = trimAttribute(attribute);

    // Shared defaults
    if (attribute.required === undefined) attribute.required = false;
    if (!attribute.validation) attribute.validation = {};

    switch (attribute.type) {
        case "enum":
            if (!attribute.subtype) attribute.subtype = "enum";
            if (!Array.isArray(attribute.values)) attribute.values = [];
            break;
        case "array":
            if (!attribute.structure) attribute.structure = "embedded";
            if (!attribute.items) attribute.items = { type: "string" };
            break;
        case "object":
            if (!attribute.structure) attribute.structure = "embedded";
            if (!attribute.properties) attribute.properties = {};
            break;
    }

    return attribute;
};

// This function checks if the selected key path is valid and if only one field is marked as isKey
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

    traverse(attributes);

    if (keyCount > 0) {
        return { valid: false, reason: "Only one field can be marked as isKey." };
    }

    return { valid: true };
};

export const getTypeHandler = (type) => TYPE_HANDLERS[type] || TYPE_HANDLERS.string;

export const createAttribute = (type, isNested = false) => {
    const attribute = getTypeHandler(type).getDefault();
    if (isNested && (type === 'object' || type === 'array')) {
        attribute.properties = {};
    }
    return attribute;
};

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
        // Replace all keys in current with newObj's keys
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
    } else if (field === 'validation') {
        if (!current[finalKey].validation) current[finalKey].validation = {};
        current[finalKey].validation[value.key] = value.value;
        current[finalKey] = normalizeAttribute(current[finalKey]);
    } else if (field === 'deleteValidation') {
        if (current[finalKey].validation) delete current[finalKey].validation[value];
        current[finalKey] = normalizeAttribute(current[finalKey]);
    } else if (field === 'delete') {
        delete current[finalKey];
    } else {
        current[finalKey][field] = value;
        current[finalKey] = normalizeAttribute(current[finalKey]);
    }

    return updatedAttributes;
};