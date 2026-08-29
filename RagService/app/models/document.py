from pydantic import BaseModel,Field

class DocumentRequest(BaseModel):
    document_id:str
    notebook_id:str
    title:str
    content:str
    metadata:dict=Field(default_factory=dict) #default_factory is used to create a new empty dictionary for each instance of DocumentRequest

class Chunk(BaseModel):
    id:str
    document_id:str
    notebook_id:str
    content:str
    chunk_index:int
    section:str | None=None #section is optional and can be None with a default value of None
    page_number:str | None=None #page number is optional and can be None with a default value of None
    metadata:dict=Field(default_factory=dict)
    heading_path: list[str] = Field(default_factory=list) #useful for contextualizing the chunk
    