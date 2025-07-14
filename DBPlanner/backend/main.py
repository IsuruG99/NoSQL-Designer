import asyncio
import json
import re
import aiohttp
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from returnToken import return_token
from typing import Optional
from contextlib import asynccontextmanager
from google import genai
from google.genai import types


app = FastAPI()

# Initialize Gemini client
client = genai.Client(api_key=return_token())  # Assuming return_token() gives Gemini API key

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def invoke_gemini(prompt: str) -> Optional[str]:
    """Execute LLM call using Gemini API"""
    max_retries = 3
    for attempt in range(1, max_retries + 1):
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    thinking_config=types.ThinkingConfig(thinking_budget=1)  # Moderate thinking
                )
            )
            
            if not response.text:
                raise ValueError("Empty response from Gemini API")
                
            # Clean up the response
            clean_response = response.text.strip()
            return re.sub(r'\n{3,}', '\n\n', clean_response)
            
        except Exception as e:
            if attempt < max_retries:
                print(f"Attempt {attempt} failed: {str(e)}. Retrying...")
                await asyncio.sleep(2)
                continue
            else:
                raise HTTPException(status_code=500, detail=f"API connection failed after {max_retries} attempts: {str(e)}")

class SchemaRequest(BaseModel):
    description: str
    entities: Optional[str] = None
    constraints: Optional[str] = None
    mode: Optional[str] = "Detailed"  # "Detailed" or "Simplified"


# Must be appended to top after AI generates PROMPT_SCHEMA
TOP_SCHEMA_SEGMENT = {
    "$schema": "http://json-schema.org/draft-07/schema#",
  "$meta": {
    "version": "1.0",
    "description": "Universal NoSQL Schema for Generate + Edit Phases"
  }
}

PROMPT_SCHEMA={
  "collections": {
    "AllTypesTest": {
      "name": "AllTypesTest",
      "attributes": {
        "StringField": {
          "type": "string",
          "required": True,
          "examples": "Sample text"
        },
        "NumberField": {
          "type": "number",
          "required": False,
          "examples": 42,
        },
        "BooleanField": {
          "type": "boolean",
          "required": False,
          "example": True
        },
        "DateField": {
          "type": "date",
          "required": False,
          "examples": "2023-10-01T12:00:00Z"
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
}

# Must be appended to bottom after AI generates PROMPT_SCHEMA
BOTTOM_SCHEMA_SEGMENT = {
    "exportOptions": {
    "mongodb": {
      "indexes": [
        { 
          "collection": "Orders", 
          "fields": { "Status": 1 }, 
          "options": { "unique": False } 
        }
      ]
    },
    "cassandra": {
      "compaction": { "class": "SizeTieredCompactionStrategy" },
      "clusteringOrder": { "Orders": { "OrderTime": "DESC" } }
    },
    "firebase": {
      "collectionGroups": ["Orders"]
    }
  }
}

@app.post("/generate-schema")
async def generate(data: SchemaRequest):
    if not data.description:
        raise HTTPException(status_code=400, detail="Description is mandatory.")

    if data.mode == "Simplified":
      prompt = (
        f"You are given a vague description. Your task is to infer a useful NoSQL database schema from it.\n\n"
        f"Description: {data.description}\n\n"
        f"Use this sample structure strictly as reference:\n"
        f"{json.dumps(PROMPT_SCHEMA['collections'], indent=2)}\n\n"
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
      prompt = (
        f"You are given a vague or partial description. Your task is to infer a realistic and structurally sound NoSQL schema.\n\n"
        f"Use the following reference structure to guide your output:\n"
        f"{json.dumps(PROMPT_SCHEMA['collections'], indent=2)}\n\n"
        f"Context:\n"
        f"- Description: {data.description}\n"
        f"- Known Entities (if any): {data.entities or 'none'}\n"
        f"- Known Constraints (if any): {data.constraints or 'none'}\n\n"
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

    try:
        raw_json = await invoke_gemini(prompt)
        if not isinstance(raw_json, str):
          raise HTTPException(status_code=500, detail="No response from LLM.")
        try:
            # Extract the JSON portion from the response
            json_start = raw_json.find('{')
            json_end = raw_json.rfind('}') + 1
            collections_section = json.loads(raw_json[json_start:json_end])
            
            # Build the complete schema by combining all parts
            complete_schema = {
                **TOP_SCHEMA_SEGMENT,
                "collections": collections_section,
                **BOTTOM_SCHEMA_SEGMENT
            }
            
            # For now, just print the result (as per your request)
            print("Generated Schema Structure:")
            print(json.dumps(complete_schema, indent=2))
            
            return {"schema": complete_schema}
            
        except json.JSONDecodeError as e:
            raise HTTPException(status_code=422, detail=f"Invalid JSON response from AI: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Schema generation failed: {str(e)}")

@app.get("/")
async def read_root():
    return {"message": "Welcome to the FastAPI application!"}