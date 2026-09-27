from abc import ABC, abstractmethod

class LLMService(ABC):
    @abstractmethod
    def generate(
        self,
        query: str,
        context: str
    ) -> str:
        pass