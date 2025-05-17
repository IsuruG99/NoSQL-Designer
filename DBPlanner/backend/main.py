import json
import asyncio
import aiohttp
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from returnToken import return_token
from typing import Optional

app = FastAPI()

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def invoke_chute(prompt: str) -> str:
    api_token = return_token()
    headers = {
        "Authorization": "Bearer " + api_token,
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
    async with aiohttp.ClientSession() as session:
        async with session.post(
            "https://llm.chutes.ai/v1/chat/completions",
            headers=headers,
            json=body
        ) as response:
            async for line in response.content:
                if line.startswith(b"data: "):
                    data = line[6:].decode("utf-8").strip()
                    if data == "[DONE]":
                        break
                    try:
                        chunk = json.loads(data)
                        if "choices" in chunk and len(chunk["choices"]) > 0:
                            content = chunk["choices"][0].get("delta", {}).get("content", "")
                            if content:
                                full_response.append(content)
                    except json.JSONDecodeError:
                        continue
    
    # Join all content pieces and clean up whitespace
    clean_response = "".join(full_response)
    
    # Replace sequences of 3+ newlines with just 2 newlines
    import re
    clean_response = re.sub(r'\n{3,}', '\n\n', clean_response)
    
    # Remove leading/trailing whitespace
    return clean_response.strip()

class SchemaRequest(BaseModel):
    description: str
    entities: Optional[str] = None
    constraints: Optional[str] = None

EXAMPLE_SCHEMA = {
    "Orders": {
        "Name": "Orders",
        "Attributes": {
            "OrderID": {"type": "string", "properties": {}},
            "OrderTime": {"type": "timestamp", "properties": {}},
            "Items": {
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
        "Generate a NoSQL collection schema in JSON format based on these requirements:\n"
        f"Description: {data.description}\n"
        f"Entities: {data.entities or 'none'}\n\n"
        "STRICT RULES:\n"
        "1. MUST use this exact format:\n"
        f"{json.dumps(EXAMPLE_SCHEMA, indent=2)}\n\n"
        "2. Only output raw JSON (no Markdown, no code fences)\n"
        "3. Maintain all field types and nesting structures\n"
        "4. Include only these fields: OrderID, OrderTime, Items, Status, TotalPrice"
    )

    try:
        raw_json = await invoke_chute(prompt)
        
        # Extract just the JSON content if needed (double-safe)
        try:
            # First try parsing directly (for clean JSON)
            result = json.loads(raw_json)
            return {"schema": result}
        except json.JSONDecodeError:
            # Fallback: extract between curly braces if there's extra text
            json_str = raw_json[raw_json.find('{'):raw_json.rfind('}')+1]
            return {"schema": json.loads(json_str)}
            
    except Exception as e:
        print(f"Error occurred: {str(e)}")
        return {"schema": EXAMPLE_SCHEMA, "error": str(e)}

@app.get("/")
async def read_root():
    return {"message": "Welcome to the FastAPI application!"}