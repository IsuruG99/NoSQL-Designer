from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from core.client import invoke_gemini
from core.prompts import SCHEMA_TEMPLATES, get_convert_prompt
from utils.json_utils import extract_json_from_response
from typing import Optional

router = APIRouter()

class FileConversionRequest(BaseModel):
    fileContent: str
    filename: str

@router.post("/convert-schema")
async def parse_file(data: FileConversionRequest) -> dict:
    """Parse the uploaded file and convert it to a schema."""
    print(f"Parsing uploaded file: {data.filename}")
    
    if not data.fileContent:
        raise HTTPException(status_code=400, detail="File content is empty.")

    try:
        prompt = get_convert_prompt(data.fileContent, data.filename)
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
        raise HTTPException(status_code=500, detail=f"File parsing failed: {str(e)}")
