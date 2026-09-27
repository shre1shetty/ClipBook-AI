from app.generation.base import LLMService

class MockLLMService(LLMService):
    def generate(
        self,
        query:str,
        context:str
    )->str:
        return (
            f"Query: {query}\n\n"
            f"Context:\n{context}"
        )