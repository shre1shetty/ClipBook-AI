from typing import Literal
from pydantic import BaseModel, Field

class ChatMessage(BaseModel):
    role : Literal["user","assistant"]
    content: str = Field(min_length=1, max_length=4_000)
    
class TextChatRequest(BaseModel):
    text: str =Field(min_length=1, max_length=60_000)
    message: str=Field(min_length=1, max_length=4_000)
    history: list[ChatMessage]=Field(default_factory=list, max_length=20)
    
class TextChatResponse(BaseModel):
    answer: str