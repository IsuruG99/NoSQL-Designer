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
        },
    },
    "Test6": {
        "Name": "5th Item",
        "Attributes": {
            "Testing": "string",
            "123": "number"
        }
    }
}
STATIC_EXTENSIVE_SCHEMA = {
    "Orders": {
        "Name": "Orders",
        "Attributes": {
            "OrderID": {"type": "string"},
            "OrderTime": {"type": "timestamp"},
            "Items": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "ItemID": {"type": "string"},
                        "Quantity": {"type": "number"},
                        "Price": {"type": "number"}
                    }
                }
            },
            "Status": {"type": "string"},
            "TotalPrice": {"type": "number"}
        }
    },
    "Salary": {
        "Name": "Salary",
        "Attributes": {
            "SalaryID": {"type": "string"},
            "StaffID": {"type": "string"},
            "Amount": {"type": "number"},
            "PaymentDate": {"type": "timestamp"}
        }
    },
    "Staff": {
        "Name": "Staff",
        "Attributes": {
            "StaffID": {"type": "string"},
            "Name": {"type": "string"},
            "PhoneNumber": {"type": "string"},
            "Role": {"type": "string"},
            "StartDate": {"type": "timestamp"},
            "Status": {"type": "string"},
            "Address": {
                "type": "object",
                "properties": {
                    "Street": {"type": "string"},
                    "City": {"type": "string"},
                    "State": {"type": "string"},
                    "ZipCode": {"type": "string"}
                }
            }
        }
    },
    "MenuItems": {
        "Name": "MenuItems",
        "Attributes": {
            "MenuItemID": {"type": "string"},
            "Name": {"type": "string"},
            "Description": {"type": "string"},
            "Price": {"type": "number"},
            "Category": {"type": "string"},
            "Availability": {"type": "boolean"},
            "Tags": {
                "type": "object",
                "properties": {
                    "Cuisine": {"type": "string"},
                    "SpicyLevel": {"type": "string"}
                }
            }
        }
    }
}

# Schema Generation (simplified till I fix the UI)
def generate_schema(data: SchemaRequest):
    if not data.description:
        raise HTTPException(status_code=400, detail="Description is mandatory.")
    
    return STATIC_EXTENSIVE_SCHEMA

# Root Endpoint
@app.get("/")
def read_root():
    return {"message": "Welcome to the FastAPI application!"}

# API Endpoint
@app.post("/generate-schema")
def generate(data: SchemaRequest):
    return {"schema": generate_schema(data)}
