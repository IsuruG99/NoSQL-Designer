import asyncio
import re
import os
from typing import Optional
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise RuntimeError("GEMINI_API_KEY not found in environment variables")

client = genai.Client(api_key=API_KEY)

# Majority of this section provided by Official Google Gemini API documentation
async def invoke_gemini(prompt: str) -> Optional[str]:
    """Execute LLM call using Gemini API"""
    max_retries = 3
    for attempt in range(1, max_retries + 1):
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    thinking_config=types.ThinkingConfig(thinking_budget=1)
                )
            )
            
            if not response.text:
                raise ValueError("Empty response from Gemini API")
                
            clean_response = response.text.strip()
            return re.sub(r'\n{3,}', '\n\n', clean_response)
            
        except Exception as e:
            if attempt < max_retries:
                print(f"Attempt {attempt} failed: {str(e)}. Retrying...")
                await asyncio.sleep(2)
                continue
            raise