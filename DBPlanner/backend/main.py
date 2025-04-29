import json
import asyncio
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from returnToken import return_token
import httpx
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

# API Configuration
API_URL = "https://api-inference.huggingface.co/models/deepseek-ai/DeepSeek-R1-Distill-Qwen-32B"
headers = {"Authorization": f"Bearer {return_token()}"}

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

async def wait_for_response_with_timeout(prompt: str):
    """Wait for API response with 60s timeout before falling back"""
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                API_URL,
                headers=headers,
                json={
                    "inputs": prompt,
                    "parameters": {
                        "temperature": 0.1,
                        "max_new_tokens": 300,
                        "do_sample": False
                    }
                }
            )
            response.raise_for_status()
            return response.json()
    except (httpx.ReadTimeout, httpx.ConnectTimeout):
        return None  # Signal timeout occurred
    except Exception:
        return None  # Signal other failure

@app.post("/generate-schema")
async def generate(data: SchemaRequest):
    if not data.description:
        raise HTTPException(status_code=400, detail="Description is mandatory.")

    old_prompt = (
        "ONLY OUTPUT JSON. Follow this exact format:\n"
        f"{json.dumps(EXAMPLE_SCHEMA, indent=2)}\n\n"
        f"Description: {data.description}\n"
        f"Entities: {data.entities or 'none'}\n"
        "Rules:\n"
        "- Only use field names: OrderID, OrderTime, Items, Status, TotalPrice\n"
        "- Items must contain: ItemID, Quantity, Price\n"
        "- Only output the JSON object, no other text\n"
    )

    prompt = (
        "Generate a NoSQL collection schema in JSON format with these requirements:\n"
        "1. MUST follow this structural format (field types and nesting):\n"
        f"{json.dumps(EXAMPLE_SCHEMA, indent=2)}\n\n"
        "2. Based on this description: {data.description}\n"
        f"3. Relevant entities: {data.entities or 'none'}\n\n"
        "RULES:\n"
        "- Maintain the exact same attribute structure (type/properties)\n"
        "- Arrays must specify 'items' type like the example\n"
        "- Objects must specify 'properties' like the example\n"
        "- Use appropriate field names for the domain\n"
        "- Only output raw JSON\n\n"
        "Field type guidelines:\n"
        "- string: For text/IDs\n"
        "- number: For prices/quantities\n"
        "- timestamp: For dates/times\n"
        "- array: For lists\n"
        "- object: For nested structures"
    )

    try:
        # Start both the API call and a timer
        api_task = asyncio.create_task(wait_for_response_with_timeout(prompt))
        timer_task = asyncio.create_task(asyncio.sleep(60))

        # Wait for either the API response or timeout
        done, pending = await asyncio.wait(
            {api_task, timer_task},
            return_when=asyncio.FIRST_COMPLETED
        )

        # Cancel whichever task didn't complete
        for task in pending:
            task.cancel()

        # Process results
        if api_task in done and not api_task.cancelled():
            response_data = api_task.result()
            if response_data is not None:  # Got valid response
                raw_output = (
                    response_data[0]["generated_text"] 
                    if isinstance(response_data, list) 
                    else response_data.get("generated_text", "")
                )
                
                try:
                    json_str = raw_output[raw_output.find('{'):raw_output.rfind('}')+1]
                    result = json.loads(json_str)
                    return {"schema": result}
                except:
                    pass

        # Calculate remaining time to sleep
        remaining_time = max(0, 60 - (asyncio.get_event_loop().time() % 60))
        await asyncio.sleep(remaining_time)
        return {"schema": EXAMPLE_SCHEMA}

    except Exception as e:
        await asyncio.sleep(60)
        return {"schema": EXAMPLE_SCHEMA}

@app.get("/")
async def read_root():
    return {"message": "Welcome to the FastAPI application!"}