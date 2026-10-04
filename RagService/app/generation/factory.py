import os
from app.providers.base import LLMProvider

class LLMProviderFactory:
    @staticmethod
    def create() -> LLMProvider:
        provider_type= os.getenv("LLM_PROVIDER").upper()
        
        if provider_type == "GEMINI":
            from app.providers.gemini import GEMINIProvider
            return GEMINIProvider() 
        
        raise ValueError(
            f"Unsupported LLM_PROVIDER: {provider_type}"
        )