from app.generation.base import LLMService
from app.providers.base import LLMProvider 
class GenerationService(LLMService):
    def __init__(
        self,
        provider: LLMProvider
    ):
        self.provider = provider
    
    def generate(
        self,
        prompt: str,
    ) -> str:
        return self.provider.generate(prompt=prompt)