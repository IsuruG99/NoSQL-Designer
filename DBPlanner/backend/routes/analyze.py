from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
from core.client import invoke_gemini
from core.prompts import get_analyze_prompt
from utils.json_utils import clean_analyze_response

router = APIRouter()

class AnalyzeRequest(BaseModel):
    name: str
    entity: Dict[str, Any]
    collections: Dict[str, Any]

@router.post("/analyze-entity")
async def analyze_entity(data: AnalyzeRequest):
    print(f"Received analyze request for entity: {data.name}")
    if not data.name or not data.entity:
        raise HTTPException(status_code=400, detail="Missing entity name or structure")

    try:
        prompt = get_analyze_prompt(data.dict())
        suggestion_raw = await invoke_gemini(prompt)
        
        if suggestion_raw is None:
            return {"suggestion": {"error": "No response from AI"}}
            
        return {"suggestion": clean_analyze_response(suggestion_raw)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Entity analysis failed: {str(e)}")