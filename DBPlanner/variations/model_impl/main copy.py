from wsgiref import headers
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from format import extract_json_from_text
from returnToken import return_token
import requests

app = FastAPI()

# Allow frontend (localhost:5173) to access backend (127.0.0.1:8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change "*" to ["http://localhost:5173"] for stricter security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API & Auth
API_URL = "https://api-inference.huggingface.co/models/deepseek-ai/DeepSeek-R1-Distill-Qwen-32B"
headers = {"Authorization": f"Bearer {return_token()}"}

# Was used for the AI, unused for now.
class SchemaRequest(BaseModel):
    description: str
    entities: str = ""
    constraints: str = ""

example_schema = {
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
    }}

# Schema Generation (simplified till I fix the UI)
def generate_schema(data: SchemaRequest):
    if not data.description:
        raise HTTPException(status_code=400, detail="Description is mandatory.")

    # Prepare API Request
    payload = {
        "inputs": (
            f"You are a NOSQL DB Schema Generator. Generate a NoSQL database schema in JSON format.\n"
            f"Output Format: {example_schema}.\n\n (MUST be in this structure)."
            f"Description: {data.description}\n (Feel free to interpret this to help generate the schema)."
            f"Entities: {set(data.entities.split(',')) if data.entities else set()}\n (These are main Entities developer imagined, you may add or modify these to suit the overall theme)."
            
            f"Constraints: {data.constraints}\n\n (Consider these as guidelines)."
            f"Your Output: Output MUST be valid JSON. MUST be in example Do not deviate from the structure, and respect all fixed values provided in the input."
        ),
        "parameters": {"temperature": 0.8},
    }

    # API Call
    try:
        response = requests.post(API_URL, headers=headers, json=payload)
        
        if response.status_code != 200:
            print("\n🚨 API Error:\n", response.text)
            return f"Error: {response.status_code} - {response.text}"
        
        response_data = response.json()
        print("\n🛠 RAW RESPONSE:\n", response_data)  # Log raw response for debugging

        # Handle both list and dict responses
        if isinstance(response_data, list) and len(response_data) > 0:
            response_text = response_data[0].get("generated_text", "")
        elif isinstance(response_data, dict) and "generated_text" in response_data:
            response_text = response_data["generated_text"]
        else:
            return "No valid response from AI."

        # Extract JSON from the response
        print("\n🧠 DeepSeek's Thought Process:\n", response_text)  # Log reasoning part
        return extract_json_from_text(response_text)

    except Exception as e:
        return f"Error: {str(e)}"

# Root Endpoint
@app.get("/")
def read_root():
    return {"message": "Welcome to the FastAPI application!"}

# API Endpoint
@app.post("/generate-schema")
def generate(data: SchemaRequest):
    return {"schema": generate_schema(data)}
