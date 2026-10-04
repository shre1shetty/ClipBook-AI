import os
from app.providers.base import LLMProvider
from google import genai

class GEMINIProvider(LLMProvider):
    def __init__(self):
        self.client=genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        self.model=os.getenv("GEMINI_MODEL")
    def generate(
        self,
        prompt: str,
    ) -> str:
        response=self.client.interactions.create(
            model=self.model,
            input=prompt
        )
        return response.output_text.strip()