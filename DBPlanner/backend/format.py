import json, re

def extract_json_from_text(response_text):
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