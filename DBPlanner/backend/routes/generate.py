from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from core.client import invoke_gemini
from core.prompts import SCHEMA_TEMPLATES, get_schema_prompt
from utils.json_utils import extract_json_from_response
import json

router = APIRouter()

class SchemaRequest(BaseModel):
    description: str
    entities: Optional[str] = None
    constraints: Optional[str] = None
    mode: Optional[str] = "Detailed"

@router.post("/generate-schema")
async def generate(data: SchemaRequest):
    print(f"Received schema generation request with mode: {data.mode}")
    if not data.description:
        raise HTTPException(status_code=400, detail="Description is mandatory.")

    try:
        prompt = get_schema_prompt(data.dict(), data.mode)
        raw_json = await invoke_gemini(prompt)
        
        if not isinstance(raw_json, str):
            raise HTTPException(status_code=500, detail="No response from LLM.")
            
        collections_section = extract_json_from_response(raw_json)
        complete_schema = {
            **SCHEMA_TEMPLATES['top_segment'],
            "collections": collections_section,
            **SCHEMA_TEMPLATES['bottom_segment']
        }
        
        return {"schema": complete_schema}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Schema generation failed: {str(e)}")