import asyncio
import re
from google import genai
from google.genai import types
from returnToken import return_token

client = genai.Client(api_key=return_token())

async def invoke_gemini(prompt: str) -> str:
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