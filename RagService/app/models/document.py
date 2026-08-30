from pydantic import BaseModel,Field

class DocumentRequest(BaseModel):
    document_id:str
    notebook_id:str
    title:str
    content:str
    metadata:dict=Field(default_factory=dict) #default_factory is used to create a new empty dictionary for each instance of DocumentRequest