// DISCLAIMER: I have very limited experience with Cassandra, so I relied on GPT-4 heavily to generate this code.

/**
 * Converts a NoSQL-style schema into a Cassandra CQL table definition.
 * Handles nested objects as UDTs, arrays, nullable fields, and primary key logic.
 * Uses `frozen` types for UDTs and lists to ensure immutability in Cassandra.
 *
 * @param {string} collectionName - Name of the collection (used as the table name).
 * @param {object} collectionData - Schema definition with attributes.
 * @param {string} [keyspace=""] - Cassandra keyspace name; defaults to "default_keyspace" if empty.
 * @returns {string} - The generated CQL string including UDT definitions and CREATE TABLE statement.
 */
export function generateCQL(collectionName, collectionData, keyspace = "") {
    /** @type {Record<string, string|null>} */
    const typeMap = {
        string: 'text',
        number: 'double',
        boolean: 'boolean',
        date: 'timestamp',
        object: null,
        array: null,
        null: 'text'
    };

    const effectiveKeyspace = keyspace && keyspace.trim() ? keyspace : "default_keyspace";
    const udtDefs = [];
    const udtNames = new Map(); /* Signature => UDT name */

    /**
     * Generates a unique user-defined type (UDT) name.
     *
     * @param {string} base - Base name to derive from attribute key.
     * @param {number} depth - Nesting depth to make name unique.
     * @returns {string} - Unique UDT name.
     */
    function getUDTName(base, depth = 0) {
        let name = `${collectionName}_${base}`;
        if (depth > 0) name += depth;
        let candidate = name;
        let i = 1;
        while (udtNames.has(candidate)) {
            candidate = name + i;
            i++;
        }
        return candidate;
    }

    /**
     * Recursively converts an attribute to its CQL type.
     *
     * @param {object} attr - Attribute definition.
     * @param {string} key - Attribute key.
     * @param {number} depth - Current depth of nesting.
     * @returns {string} - CQL-compatible type string.
     */
    function processAttr(attr, key, depth = 0) {
        if (attr.type === "object" && attr.properties && Object.keys(attr.properties).length > 0) {
            const signature = JSON.stringify(Object.keys(attr.properties).sort());
            if (!udtNames.has(signature)) {
                const udtName = getUDTName(key.charAt(0).toUpperCase() + key.slice(1), depth);
                udtNames.set(signature, udtName);
                const fields = Object.entries(attr.properties).map(
                    ([subKey, subAttr]) => `    "${subKey}" ${processAttr(subAttr, subKey, depth + 1)}`
                );
                udtDefs.push(
                    `CREATE TYPE IF NOT EXISTS "${effectiveKeyspace}"."${udtName}" (\n${fields.join(',\n')}\n);`
                );
            }
            return `frozen<"${udtNames.get(signature)}">`;
        }

        if (attr.type === "array" && attr.items) {
            if (attr.items.type === "object" && attr.items.properties && Object.keys(attr.items.properties).length > 0) {
                const signature = JSON.stringify(Object.keys(attr.items.properties).sort());
                if (!udtNames.has(signature)) {
                    const udtName = getUDTName(key.charAt(0).toUpperCase() + key.slice(1) + "Item", depth);
                    udtNames.set(signature, udtName);
                    const fields = Object.entries(attr.items.properties).map(
                        ([subKey, subAttr]) => `    "${subKey}" ${processAttr(subAttr, subKey, depth + 1)}`
                    );
                    udtDefs.push(
                        `CREATE TYPE IF NOT EXISTS "${effectiveKeyspace}"."${udtName}" (\n${fields.join(',\n')}\n);`
                    );
                }
                return `list<frozen<"${udtNames.get(signature)}">>`;
            } else {
                return `list<${typeMap[attr.items.type] || 'text'}>`
            }
        }
        
        return typeMap[attr.type] || 'text' /* nullable */;
    }

    const attributes = collectionData.attributes || {};
    const columns = Object.entries(attributes).map(([key, attr]) => {
        const colType = processAttr(attr, key);
        const comment = attr.nullable && !colType.includes('nullable') ? ' /* nullable */' : '';
        return { key, col: `    "${key}" ${colType}${comment}` };
    });

    const primaryKeyEntry = Object.entries(attributes).find(([_, attr]) => attr.isKey)
        || Object.entries(attributes).find(([key]) => key.toLowerCase() === "id");

    let pk;
    const columnsStrings = columns.map(c => c.col);
    let pkKey;

    /* If No PK, use first key or "id" */
    if (primaryKeyEntry) { 
        pkKey = primaryKeyEntry[0];
        pk = `"${pkKey}"`;
    } else {
        const autoId = `${collectionName}_id`;
        pkKey = autoId;
        columnsStrings.push(`    "${autoId}" uuid /* auto-generated PK */`);
        pk = `"${autoId}"`;
    }

    const pkIndex = columnsStrings.findIndex(col => col.trim().startsWith(`"${pkKey}" `));
    if (pkIndex > 0) {
        const [pkCol] = columnsStrings.splice(pkIndex, 1);
        columnsStrings.unshift(pkCol);
    }

    const tableRef = `"${effectiveKeyspace}"."${collectionName}"`;

    return (
        `${udtDefs.length ? udtDefs.join('\n\n') + '\n\n' : ''}CREATE TABLE IF NOT EXISTS ${tableRef}(
${columnsStrings.join(',\n')},
    PRIMARY KEY (${pk})
);`
    );
}

/**
 * Wrapper around `generateCQL` for generating a single collection’s Cassandra export.
 *
 * @param {string} collectionName - The name of the collection.
 * @param {object} schema - The full schema object with a `collections` field.
 * @param {string} [keyspace] - Optional keyspace name.
 * @returns {string} - CQL string.
 */
export function getCassandraExport(collectionName, schema, keyspace) {
    return generateCQL(collectionName, schema.collections[collectionName], keyspace);
}
