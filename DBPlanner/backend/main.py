from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
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

# Request Model
class SchemaRequest(BaseModel):
    description: str
    entities: str = ""
    constraints: str = ""

# Static Response JSON
STATIC_SCHEMA = {
    "Orders": {
        "Name": "Orders",
        "Attributes": {
            "OrderID": "string",
            "OrderTime": "timestamp",
            "Items": "array",
            "Status": "string",
            "TotalPrice": "number"
        }
    },
    "Salary": {
        "Name": "Salary",
        "Attributes": {
            "SalaryID": "string",
            "StaffID": "string",
            "Amount": "number",
            "PaymentDate": "timestamp"
        }
    },
    "Staff": {
        "Name": "Staff",
        "Attributes": {
            "StaffID": "string",
            "Name": "string",
            "PhoneNumber": "string",
            "Role": "string",
            "StartDate": "timestamp",
            "Status": "string"
        }
    },
    "MenuItems": {
        "Name": "MenuItems",
        "Attributes": {
            "MenuItemID": "string",
            "Name": "string",
            "Description": "string",
            "Price": "number",
            "Category": "string",
            "Availability": "boolean"
        }
    }
}

# Schema Generation Logic (Now simplified)
def generate_schema(data: SchemaRequest):
    if not data.description:
        raise HTTPException(status_code=400, detail="Description is mandatory.")
    
    # Just return the static schema
    return STATIC_SCHEMA

# API Endpoint
@app.post("/generate-schema")
def generate(data: SchemaRequest):
    return {"schema": generate_schema(data)}
