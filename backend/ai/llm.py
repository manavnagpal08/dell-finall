import os
import json
import logging
import google.generativeai as genai

logger = logging.getLogger(__name__)

def configure_gemini():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return False
    genai.configure(api_key=api_key)
    return True

def generate_json_response(prompt: str) -> dict | list | None:
    if not configure_gemini():
        return None

    try:
        # Use gemini-2.5-flash and force JSON response format
        model = genai.GenerativeModel(
            'gemini-2.5-flash',
            generation_config={"response_mime_type": "application/json"}
        )
        response = model.generate_content(prompt)
        text = response.text.strip()
        return json.loads(text)
    except Exception as e:
        logger.error(f"Gemini API Error: {e}")
        return None

def generate_text_response(prompt: str) -> str | None:
    if not configure_gemini():
        return None

    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        logger.error(f"Gemini API Error (Text): {e}")
        return None
