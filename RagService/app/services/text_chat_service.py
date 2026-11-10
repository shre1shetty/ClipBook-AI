from app.generation.base import LLMService
from app.models.text_chat import TextChatRequest, TextChatResponse
from app.prompt.base import PromptBuilder

class TextChatService:
    def __init__(self, prompt_builder: PromptBuilder, llm_service: LLMService):
        self.prompt_builder = prompt_builder
        self.llm_service = llm_service
    
    def answer(self, request: TextChatRequest) -> TextChatResponse:
        prompt = self.prompt_builder.build_text_chat_prompt(
            text=request.text,
            message=request.message,
            history=request.history
        )
        answer = self.llm_service.generate(prompt=prompt)
        return TextChatResponse(answer=answer)