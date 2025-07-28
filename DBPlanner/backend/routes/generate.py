from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from core.client import invoke_gemini
from core.prompts import SCHEMA_TEMPLATES, get_schema_prompt
from utils.json_utils import extract_json_from_response
import json

router = APIRouter()

class SchemaRequest(BaseModel):
    mode: str
    description: Optional[str] = None
    entities: Optional[str] = None
    constraints: Optional[str] = None
    systemType: Optional[str] = None
    dataPurpose: Optional[str] = None


@router.post("/generate-schema")
async def generate(data: SchemaRequest):
    print(f"Received schema generation request with mode: {data.mode}")

    if data.mode == "Detailed":
        if not data.description:
            raise HTTPException(status_code=400, detail="Description is mandatory for Detailed mode.")
    elif data.mode == "Simplified":
        if not data.systemType or not data.dataPurpose:
            raise HTTPException(status_code=400, detail="systemType and dataPurpose are required for Simplified mode.")
    else:
        raise HTTPException(status_code=400, detail="Invalid mode.")

    try:
        # Pass the whole dict and mode to your prompt generator
        prompt = get_schema_prompt(data.dict(), data.mode)
        raw_json = await invoke_gemini(prompt)

        if not isinstance(raw_json, str):
            raise HTTPException(status_code=500, detail="No response from LLM.")

        collections_section = extract_json_from_response(raw_json)
        complete_schema = {
            **SCHEMA_TEMPLATES['top_segment'],
            "collections": collections_section
        }

        return {"schema": complete_schema}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Schema generation failed: {str(e)}")
