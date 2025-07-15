import json

def extract_json_from_response(raw_response: str) -> dict:
    """Extracts JSON from a string response that might contain markdown or other formatting"""
    try:
        json_start = raw_response.find('{')
        json_end = raw_response.rfind('}') + 1
        return json.loads(raw_response[json_start:json_end])
    except (ValueError, json.JSONDecodeError) as e:
        raise ValueError(f"Failed to extract JSON: {str(e)}")

def clean_analyze_response(raw_response: str) -> dict:
    """Cleans and parses the analysis response"""
    cleaned = raw_response.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        if lines[0].startswith("```"):
            lines.pop(0)
        if lines[-1].startswith("```"):
            lines.pop(-1)
        cleaned = "\n".join(lines).strip()
    
    try:
        parsed = json.loads(cleaned)
        return {k: v for k, v in parsed.items() if isinstance(v, list) and len(v) > 0}
    except json.JSONDecodeError:
        return {"error": "Failed to parse AI JSON response", "raw": raw_response}