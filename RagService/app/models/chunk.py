from pydantic import BaseModel,Field

class Chunk(BaseModel):
    id:str
    document_id:str
    notebook_id:str
    content:str
    chunk_index:int
    section:str | None=None #section is optional and can be None with a default value of None
    page_number:int | None=None #page number is optional and can be None with a default value of None
    metadata:dict=Field(default_factory=dict)
    heading_path: list[str] = Field(default_factory=list) #useful for contextualizing the chunk