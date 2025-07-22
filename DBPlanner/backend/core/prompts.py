import json
from typing import Dict, Any

SCHEMA_TEMPLATES = {
    "top_segment": {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "$meta": {
            "version": "1.4",
            "description": "Universal NoSQL Schema for Generate + Edit Phases"
        }
    },
    "example": {
        "collections": {
            "AllTypesTest": {
                "name": "AllTypesTest",
                "attributes": {
                    "StringField": {
                        "type": "string",
                        "required": True,
                        "examples": ["Sample text", "Another example", "Test value"]
                    },
                    "NumberField": {
                        "type": "number",
                        "required": False,
                        "examples": [42, 3.14]
                    },
                    "BooleanField": {
                        "type": "boolean",
                        "required": False
                    },
                    "DateField": {
                        "type": "date",
                        "required": False,
                        "examples": ["2023-10-01T12:00:00Z", "2024-01-15T00:00:00Z"]
                    },
                    "NullField": {
                        "type": "null"
                    },
                    "ArrayField": {
                        "type": "array",
                        "structure": "embedded",
                        "items": {
                            "type": "string"
                        }
                    },
                    "ObjectField": {
                        "type": "object",
                        "structure": "embedded",
                        "properties": {
                            "NestedKey": {
                                "type": "boolean"
                            }
                        }
                    }
                }
            }
        }
    },
    "bottom_segment": {
        "exportOptions": {
            "mongodb": {
                "indexes": [
                    { 
                        "collection": "Col1", 
                        "fields": { "Status": 1 }, 
                        "options": { "unique": False } 
                    }
                ]
            },
            "cassandra": {
                "compaction": { "class": "SizeTieredCompactionStrategy" },
                "clusteringOrder": { "Col1": "ASC" },
            },
            "firebase": {
                "collectionGroups": ["Col1"]
            }
        }
    }
}

def get_schema_prompt(data: Dict[str, Any], mode: str = "Detailed") -> str:
    """Generate the appropriate prompt based on the requested mode"""
    if mode == "Simplified":
        return (
            f"You are given a vague description. Your task is to infer a useful NoSQL database schema from it.\n\n"
            f"Description: {data['description']}\n\n"
            f"Use this sample structure strictly as reference:\n"
            f"{json.dumps(SCHEMA_TEMPLATES['example']['collections'], indent=2)}\n\n"
            "Rules:\n"
            "1. Infer meaningful collection names and attributes from the sentence.\n"
            "2. Output ONLY the collections section in pure JSON format (starting with '{' and ending with '}').\n"
            "3. Follow the type definitions and nesting style shown in the example.\n"
            "4. If nested objects are used, define subfields properly with types.\n"
            "5. Use plural names for collections where appropriate.\n"
            "6. Only use these exact types: string, number, boolean, object, array, date.\n"
            "7. For all fields, include an 'examples' array with **exactly 3–5 values**.\n"
            "8. Avoid 'null' as a standalone type - use optional fields instead.\n"
            "9. Do NOT use `required` directly on embedded object fields. Only use it inside their properties.\n"
            "10. Do NOT add fields like 'description' at the collection level unless it appears in the structure.\n"
            "11. Ensure embedded objects follow the `structure: 'embedded'` pattern.\n"
            "12. Validate your output format and match the sample reference exactly."
        )
    else:
        return (
            f"You are given a vague or partial description. Your task is to infer a realistic and structurally sound NoSQL schema.\n\n"
            f"Use the following reference structure to guide your output:\n"
            f"{json.dumps(SCHEMA_TEMPLATES['example']['collections'], indent=2)}\n\n"
            f"Context:\n"
            f"- Description: {data['description']}\n"
            f"- Known Entities (if any): {data.get('entities', 'none')}\n"
            f"- Known Constraints (if any): {data.get('constraints', 'none')}\n\n"
            "Rules:\n"
            "1. Maintain exact type definitions and nesting as shown in the reference schema.\n"
            "2. Only use these types: string, number, boolean, object, array, date.\n"
            "3. For nested objects, define subfields under `properties` and use `structure: 'embedded'`.\n"
            "4. Never apply `required` to the object field itself — only to its subfields.\n"
            "5. Use plural, domain-appropriate collection names (e.g., Products, Customers, Orders).\n"
            "6. Include at least 2–3 collections if the domain suggests multiple entities.\n"
            "7. Output must be **only** the `collections` section as a valid JSON object (no markdown or commentary).\n"
            "8. Use `examples` for string, number, and date fields only — limit to **1–2 concise values** per field.\n"
            "9. Do NOT use `examples` for boolean fields.\n"
            "10. Do NOT repeat fields from related collections (e.g., product `name` inside order items) — only reference IDs and context-specific fields (e.g., price at purchase).\n"
            "11. Do NOT place `examples` on entire embedded object fields — only on individual subfields inside `properties`.\n"
            "12. Do NOT include fields like `description` at the collection level unless shown in the reference.\n"
            "13. Validate structure before responding. Output must exactly match the shape, nesting, and formatting style of the reference.\n"
            "14. Format `examples` values always as an array, never as a single string or number.\n"
        )

def get_analyze_prompt(data: Dict[str, Any]) -> str:
    """Generate the analysis prompt with example output format"""
    analyze_output_format = {
        "Required Field Changes": [
            "Rename 'videoID' to '_id' (string, required: true) to serve as the primary identifier.",
            "Set 'videoURL' (string) to required: true as it's essential for a video entry."
        ],
        "Optional Fields to Add": [
            "Add 'description' (string, required: false) for detailed information."
        ],
        "Computed / Denormalized Fields": [
            "Add 'viewsCount' (number, required: true, default: 0) to track video viewership."
        ],
        "Index Recommendations": [
            "On '_id' for efficient primary key lookups."
        ]
    }

    return (
        f"You are a NoSQL schema analyst reviewing a collection named '{data['name']}'.\n\n"
        f"=== Target Collection ===\n"
        f"{json.dumps(data['entity'], indent=2)}\n\n"
        f"=== Other Collections in Schema (Context Only) ===\n"
        f"{json.dumps({k: v['attributes'] for k, v in data['collections'].items() if k != data['name']}, indent=2)}\n\n"
        "Analyze only the target collection.\n"
        "Use these 4 categories to group your suggestions:\n"
        "1. Required Field Changes — rename fields, fix required flags, adjust ID format\n"
        "2. Optional Fields to Add — useful fields to improve the schema but not mandatory\n"
        "3. Computed / Denormalized Fields — fields to store counts, totals, or derived data\n"
        "4. Index Recommendations — suggest which fields to index to speed up queries\n\n"
        "Rules:\n"
        "1. Write suggestions clearly and simply, so beginners to intermediate users can understand.\n"
        "2. Avoid jargon, complex database theory, or deep industry standards.\n"
        "3. Be concise; focus on what to do, not why.\n"
        "4. Only use basic NoSQL types: string, number, boolean, object, array, date.\n"
        "5. Output a JSON object with exactly these 4 keys, each containing an array of suggestion strings.\n"
        "6. If a category has no suggestions, you may omit it from the JSON.\n"
        "7. Do not include explanations or definitions.\n"
        "8. Respond **only** with the JSON object — no markdown, no commentary.\n\n"
        f"Expected format example:\n"
        f"{json.dumps(analyze_output_format, indent=2)}"
    )

def get_convert_prompt(file_content: str, filename: str) -> str:
    """Prompt to convert raw file contents (JSON, BSON, CQL, SQL, etc.) into schema format"""
    return (
        f"You are a strict NoSQL schema converter.\n\n"
        f"Task:\n"
        f"- Analyze the given file content (from an uploaded schema-related file).\n"
        f"- DO NOT modify any actual data values or meaning.\n"
        f"- Your job is only to interpret and restructure it into a clean NoSQL schema.\n\n"
        f"Output Format:\n"
        f"Return only the `collections` section, using this exact structure:\n"
        f"{json.dumps(SCHEMA_TEMPLATES['example']['collections'], indent=2)}\n\n"
        f"Input File: {filename}\n\n"
        f"=== Begin File Content ===\n"
        f"{file_content}\n"
        f"=== End File Content ===\n\n"
        f"Instructions:\n"
        f"1. Infer collections and their attributes based on field names, types, and nesting.\n"
        f"2. Stick to these types only: string, number, boolean, object, array, date.\n"
        f"3. Use `structure: 'embedded'` for nested objects/arrays.\n"
        f"4. Include 'examples' with 3–5 values per field where possible (for string/number/date only).\n"
        f"5. Skip irrelevant metadata or comments — only schema logic matters.\n"
        f"6. DO NOT return SQL or other code — only return the final JSON `collections` structure.\n"
        f"7. Validate your output — make sure it's clean JSON and uses the sample schema shape.\n"
    )