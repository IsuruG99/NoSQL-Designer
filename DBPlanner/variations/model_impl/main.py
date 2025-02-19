from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
import re, json
from fastapi.middleware.cors import CORSMiddleware

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
from returnToken import return_token  # Assuming your token function is here
headers = {"Authorization": f"Bearer {return_token()}"}

# Request Model
class SchemaRequest(BaseModel):
    description: str
    entities: str = ""
    constraints: str = ""

def extract_json_from_text(response_text):
    """Extract JSON from DeepSeek's response and log the reasoning part."""
    
    # Try to capture everything that looks like a JSON object
    json_part_match = re.search(r"```json\n(.*?)\n```", response_text, re.DOTALL)
    
    if json_part_match:
        # Extract the JSON part inside the code block
        json_part = json_part_match.group(1).strip()  # Extract the actual JSON string

        # Remove the non-JSON parts for reasoning
        reasoning_part = response_text.replace(json_part_match.group(0), "").strip()  # The part before and after the JSON block
        
        print("\n🧠 DeepSeek's Thought Process:\n", reasoning_part)  # Log the reasoning part

        try:
            # Fix any single quotes to double quotes (common in response)
            fixed_json = json.loads(json_part.replace("'", "\""))
            
            # Return the formatted JSON
            return json.dumps(fixed_json, indent=2)
        
        except json.JSONDecodeError as e:
            return f"Error: Invalid JSON format - {str(e)}"
    
    return "Error: No JSON detected in the response."

# Schema Generation Logic
def generate_schema(data: SchemaRequest):
    if not data.description:
        raise HTTPException(status_code=400, detail="Description is mandatory.")

    example_output_JSON = {
        "Entity1": {"Name": "Entity1_Name", "Attributes": {"attribute1": "type", "attribute2": "type"}},
        "Entity2": {"Name": "Entity2_Name", "Attributes": {"attribute1": "type", "attribute2": "type"}},
    }

    # Prepare API Request
    payload = {
        "inputs": (
            f"You are a NOSQL DB Schema Generator. Generate a NoSQL database schema in JSON format.\n"
            f"Output Format = {example_output_JSON}.\n\n (MUST be in this structure)."
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
        return extract_json_from_text(response_text)

    except Exception as e:
        return f"Error: {str(e)}"

# API Endpoint
@app.post("/generate-schema")
def generate(data: SchemaRequest):
    return {"schema": generate_schema(data)}
