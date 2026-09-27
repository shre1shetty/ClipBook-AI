from app.context.base import ContextBuilder
from app.models.retrieved_chunk import RetrievedChunk

class SimpleContextBuilder(ContextBuilder):
    def build(
        self,
        chunks: list[RetrievedChunk]
    ) -> str:
        if not chunks:
            return ""
        
        context_parts: list[str]=[]
        
        for retrieved_chunk  in chunks:
            chunk= retrieved_chunk.chunk
            if chunk.heading_path:
                heading_path = " > ".join(chunk.heading_path)
                section = chunk.section
                context_parts.append(
                    f"Section: {section}\nHeading Path: {heading_path}\nContent:\n{chunk.content}\n"
                    f"{chunk.content}"
                )
            else:
                context_parts.append(chunk.content)
        
        return "\n\n".join(context_parts)
                
            