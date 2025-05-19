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

app = FastAPI()

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@asynccontextmanager
async def get_aiohttp_session():
    """Async context manager for aiohttp session"""
    session = aiohttp.ClientSession()
    try:
        yield session
    finally:
        await session.close()

async def invoke_chute(prompt: str) -> str:
    """Execute LLM call with proper async resource handling"""
    api_token = return_token()
    headers = {
        "Authorization": f"Bearer {api_token}",
        "Content-Type": "application/json"
    }
    
    body = {
        "model": "deepseek-ai/DeepSeek-V3-0324",
        "messages": [{"role": "user", "content": prompt}],
        "stream": True,
        "max_tokens": 4096,
        "temperature": 0.7
    }

    full_response = []
    async with get_aiohttp_session() as session:
        try:
            async with session.post(
                "https://llm.chutes.ai/v1/chat/completions",
                headers=headers,
                json=body,
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                
                async for line in response.content:
                    if line.startswith(b"data: "):
                        data = line[6:].decode("utf-8").strip()
                        if data == "[DONE]":
                            break
                        try:
                            chunk = json.loads(data)
                            if content := chunk.get("choices", [{}])[0].get("delta", {}).get("content"):
                                full_response.append(content)
                        except json.JSONDecodeError:
                            continue

            clean_response = "".join(full_response)
            return re.sub(r'\n{3,}', '\n\n', clean_response).strip()
            
        except (aiohttp.ClientError, asyncio.TimeoutError) as e:
            raise HTTPException(status_code=500, detail=f"API connection failed: {str(e)}")

class SchemaRequest(BaseModel):
    description: str
    entities: Optional[str] = None
    constraints: Optional[str] = None

EXAMPLE_SCHEMA = {
    # Overall schema structure is the entire nosql schema, not asingle collection
    "Orders": # this is one of the collections, this "Orders" is just an identifier
    {
        "Name": "Orders", # Name of the collection
        "Attributes": { # Attributes of the collection
            "OrderID": {"type": "string", "properties": {}}, #  Sub attributes of the attribute, properties are empty for none-nested attribute types(string, number, boolean)
            "OrderTime": {"type": "timestamp", "properties": {}},
            "Items": { # some attributes may be nested. In this case, Items is an array of objects
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "ItemID": {"type": "string", "properties": {}},
                        "Quantity": {"type": "number", "properties": {}},
                        "Price": {"type": "number", "properties": {}}
                    }
                },
                "properties": {}
            },
            "Status": {"type": "string", "properties": {}},
            "TotalPrice": {"type": "number", "properties": {}}
        }
    }
}

@app.post("/generate-schema")
async def generate(data: SchemaRequest):
    if not data.description:
        raise HTTPException(status_code=400, detail="Description is mandatory.")

    prompt = (
        f"Generate NoSQL JSON schema exactly matching this structure:\n"
        f"{json.dumps(EXAMPLE_SCHEMA, indent=2)}\n\n"
        f"Requirements:\n"
        f"- Description: {data.description}\n"
        f"- Entities: {data.entities or 'none'}\n"
        f"- Constraints: {data.constraints or 'none'}\n\n"
        "Rules:\n"
        "1. Maintain exact type definitions and nesting of example schema\n"
        "2. Output pure JSON only"
        "3. Entities are not finalized, so use them as hints\n"
        "4. Constraints are not finalized, so use them as hints\n"
    )

    try:
        raw_json = await invoke_chute(prompt)
        try:
            return {"schema": json.loads(raw_json[raw_json.find('{'):raw_json.rfind('}')+1])}
        except json.JSONDecodeError as e:
            raise HTTPException(status_code=422, detail=f"Invalid JSON response: {str(e)}")
            
    except Exception as e:
        return {"schema": EXAMPLE_SCHEMA, "error": str(e)}

@app.get("/")
async def read_root():
    return {"message": "Welcome to the FastAPI application!"}