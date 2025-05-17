# from fastapi import HTTPException
# from main import SchemaRequest

# Example Static Schema till UI is ready
static_example_schema = {
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
    # ,
    # "Salary": {
    #     "Name": "Salary",
    #     "Attributes": {
    #         "SalaryID": {"type": "string", "properties": {}},
    #         "StaffID": {"type": "string", "properties": {}},
    #         "Amount": {"type": "number", "properties": {}},
    #         "PaymentDate": {"type": "timestamp", "properties": {}}
    #     }
    # },
    # "Staff": {
    #     "Name": "Staff",
    #     "Attributes": {
    #         "StaffID": {"type": "string", "properties": {}},
    #         "Name": {"type": "string", "properties": {}},
    #         "PhoneNumber": {"type": "string", "properties": {}},
    #         "Role": {"type": "string", "properties": {}},
    #         "StartDate": {"type": "timestamp", "properties": {}},
    #         "Status": {"type": "string", "properties": {}},
    #         "Address": {
    #             "type": "object",
    #             "properties": {
    #                 "Street": {"type": "string", "properties": {}},
    #                 "City": {"type": "string", "properties": {}},
    #                 "State": {"type": "string", "properties": {}},
    #                 "ZipCode": {"type": "string", "properties": {}}
    #             }
    #         }
    #     }
    # },
    # "MenuItems": {
    #     "Name": "MenuItems",
    #     "Attributes": {
    #         "MenuItemID": {"type": "string", "properties": {}},
    #         "Name": {"type": "string", "properties": {}},
    #         "Description": {"type": "string", "properties": {}},
    #         "Price": {"type": "number", "properties": {}},
    #         "Category": {"type": "string", "properties": {}},
    #         "Availability": {"type": "boolean", "properties": {}},
    #         "Tags": {
    #             "type": "object",
    #             "properties": {
    #                 "Cuisine": {"type": "string", "properties": {}},
    #                 "SpicyLevel": {"type": "string", "properties": {}}
    #             }
    #         }
    #     }
    # }
}

def example_schema():
    return static_example_schema  # Return the static schema for now

# # Schema Generation (simplified till I fix the UI)
# def generate_schema(data: SchemaRequest):
#     if not data.description:
#         raise HTTPException(status_code=400, detail="Description is mandatory.")
    
#     return static_example_schema  # Return the static schema for now