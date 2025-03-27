from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Just CORS Things
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change "*" to ["http://localhost:5173"] for stricter security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Was used for the AI, unused for now.
class SchemaRequest(BaseModel):
    description: str
    entities: str = ""
    constraints: str = ""

# Example Static Schema till UI is ready
STATIC_EXAMPLE_SCHEMA = {
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
    },
    "Salary": {
        "Name": "Salary",
        "Attributes": {
            "SalaryID": {"type": "string", "properties": {}},
            "StaffID": {"type": "string", "properties": {}},
            "Amount": {"type": "number", "properties": {}},
            "PaymentDate": {"type": "timestamp", "properties": {}}
        }
    },
    "Staff": {
        "Name": "Staff",
        "Attributes": {
            "StaffID": {"type": "string", "properties": {}},
            "Name": {"type": "string", "properties": {}},
            "PhoneNumber": {"type": "string", "properties": {}},
            "Role": {"type": "string", "properties": {}},
            "StartDate": {"type": "timestamp", "properties": {}},
            "Status": {"type": "string", "properties": {}},
            "Address": {
                "type": "object",
                "properties": {
                    "Street": {"type": "string", "properties": {}},
                    "City": {"type": "string", "properties": {}},
                    "State": {"type": "string", "properties": {}},
                    "ZipCode": {"type": "string", "properties": {}}
                }
            }
        }
    },
    "MenuItems": {
        "Name": "MenuItems",
        "Attributes": {
            "MenuItemID": {"type": "string", "properties": {}},
            "Name": {"type": "string", "properties": {}},
            "Description": {"type": "string", "properties": {}},
            "Price": {"type": "number", "properties": {}},
            "Category": {"type": "string", "properties": {}},
            "Availability": {"type": "boolean", "properties": {}},
            "Tags": {
                "type": "object",
                "properties": {
                    "Cuisine": {"type": "string", "properties": {}},
                    "SpicyLevel": {"type": "string", "properties": {}}
                }
            }
        }
    }
}

# Schema Generation (simplified till I fix the UI)
def generate_schema(data: SchemaRequest):
    if not data.description:
        raise HTTPException(status_code=400, detail="Description is mandatory.")
    
    return STATIC_EXAMPLE_SCHEMA

# Root Endpoint
@app.get("/")
def read_root():
    return {"message": "Welcome to the FastAPI application!"}

# API Endpoint
@app.post("/generate-schema")
def generate(data: SchemaRequest):
    return {"schema": generate_schema(data)}
