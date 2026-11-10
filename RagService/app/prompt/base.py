from abc import ABC, abstractmethod
from app.models.text_chat import ChatMessage

class PromptBuilder(ABC):
    @abstractmethod
    def build_prompt(
        self,
        query: str,
        context: str
    ) -> str:
        pass
    @abstractmethod
    def build_text_chat_prompt(
        self,
        text: str,
        message: str,
        history: list[ChatMessage]
    ) -> str:
        pass