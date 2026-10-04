from abc import ABC, abstractmethod

class PromptBuilder(ABC):
    @abstractmethod
    def build_prompt(
        self,
        query: str,
        context: str
    ) -> str:
        pass