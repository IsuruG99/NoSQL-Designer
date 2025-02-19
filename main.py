from fastapi import FastAPI
from pydantic import BaseModel
import requests

app = FastAPI()

class UserInput(BaseModel):
    description: str
    entities: str
    tasks: str
    constraints: str

@app.post("/api/generate-schema")
async def generate_schema(input: UserInput):
    payload = {
        "inputs": f"{input.description} {input.entities} {input.tasks} {input.constraints}",
    }
    
    # Replace with actual HuggingFace API URL and headers
    response = requests.post(
        "https://huggingface.co/models/your-model-id",
        json=payload,
        headers={"Authorization": "Bearer your-api-token"}
    )

    # Return the raw response from HuggingFace as the schema data
    return response.json()


