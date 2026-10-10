import re
import uuid
from app.chunking.base import Chunker
from app.models.document import DocumentRequest
from app.models.chunk import Chunk


class DocumentChunker(Chunker):
    def __init__(self,chunk_size:int=1000,chunk_overlap:int=150): #constructor
        if chunk_overlap>=chunk_size:
            raise ValueError("chunk_overlap must be smaller than chunk_size")
        self.chunk_size=chunk_size
        self.chunk_overlap=chunk_overlap
    
    def chunk(self,document:DocumentRequest)->list[Chunk]:
        sections=self._extract_sections(document.content)
        
        chunks:list[Chunk]=[]
        
        for section in sections:
            content=section["content"]
            
            # If chunk is already small enough.
            if len(content) <= self.chunk_size:
                split_contents = [content]
            
            # If chunk is greater than size split recursively
            else:
                split_contents = self._recursive_split(content)
            
            for content_part in split_contents:
                chunks.append(
                    Chunk(
                        id=str(uuid.uuid4()),
                        notebook_id=document.notebook_id,
                        content=content_part,
                        chunk_index=len(chunks),
                        section=(
                            section["heading_path"][-1]
                            if section["heading_path"]
                            else None
                        ),
                        heading_path=section["heading_path"],
                        metadata=document.metadata.copy()
                    )
                )
    
        return chunks
    
    def _extract_sections(self,content:str)->list[dict]:
        lines=content.splitlines()
        sections:list[dict]=[]
        current_content:list[str]=[]
        heading_path:list[str]=[]
        
        for line in lines:
            
            heading_match=re.match(
                r"^(#{1,6})\s+(.+?)\s*$", # Checks if the line starts with a Markdown-style heading
                line
            )
            
            if heading_match:
                #save the previous section
                if current_content:
                    section_content="\n".join(current_content).strip()
                    if section_content:
                        sections.append(
                            {
                                "content":section_content,
                                "heading_path":heading_path.copy()
                            }
                        )
                    current_content=[]
            
                level=len(heading_match.group(1))
                heading=heading_match.group(2).strip()
                
                # Remove headings at the same/deeper level
                heading_path=heading_path[:level-1]
                heading_path.append(heading)
            else:
                current_content.append(line)
        
        # Save the final section.
        if current_content:
            section_content="\n".join(current_content).strip()
            if section_content:
                sections.append(
                    {
                        "content":section_content,
                        "heading_path":heading_path.copy()
                    }
                )
        return sections
    def _recursive_split(self,text:str)->list[str]:
        seperators=[
            "\n\n",
            "\n",
            ". ",
            " "
        ]

        # Apply overlap once, after recursion has produced the final raw chunks.
        chunks = self._split_recursive(text=text.strip(),seperators=seperators)
        return self._apply_overlap(chunks)
    
    def _split_recursive(self,text:str,seperators:list[str])->list[str]:
        # If this piece is already small enough, no further splitting is necessary
        if len(text)<=self.chunk_size:
            return [text]
        
        # Recursively call _split_recursive till chunk is less than equal to chunk_size
        
        if not seperators:
            return self._hard_split(text)
        
        seperator=seperators[0]
        
        parts=text.split(seperator)
        # Keep each delimiter with the text before it so chunk boundaries don't lose content.
        segments = [
            f"{part}{seperator}" for part in parts[:-1]
        ] + [parts[-1]]
        
        #If seperator doesnt split anything try next seperator
        if len(parts)==1:
            return self._split_recursive(text,seperators[1:]) # return every element of list except 1st

        chunks:list[str]=[]
        current:str=''
        
        for segment in segments:
            candidate = current + segment
            
            if len(candidate)<=self.chunk_size:
                current=candidate
                continue
            
            # Current piece have value
            
            if current.strip():
                chunks.append(current.strip())
            
            # If length of individual part is greater than chunk size
            
            if len(segment)> self.chunk_size:
                nested_chunks=self._split_recursive(segment,seperators[1:])
                chunks.extend(nested_chunks)
                current=''
            else:
                current=segment
        
        if current.strip():
            chunks.append(current.strip())

        return chunks
        
    def _hard_split(self,text:str)->list[str]:
        # Last option when no seperator is useful
        chunks:list[str]=[]
        start=0
        
        while start < len(text):
            end=min(
                start+self.chunk_size,
                len(text)
            )
            
            chunk=text[start:end].strip()
            
            if chunk:
                chunks.append(chunk)
            
            if end>=len(text):
                break
                
            start=end
        return chunks
            
    def _apply_overlap(self, chunks: list[str]) -> list[str]:
        if len(chunks) <= 1:
            return chunks
    
        overlapped: list[str] = [chunks[0]]
    
        for i in range(1, len(chunks)):
            previous = chunks[i - 1]
            current = chunks[i]
    
            # Reserve one character for the space joining overlap to current.
            available_space = self.chunk_size - len(current) - 1
    
            if available_space <= 0:
                overlapped.append(current)
                continue
    
            overlap_limit = min(
                self.chunk_overlap,
                available_space,
                len(previous)
            )
    
            overlap = self._get_overlap(previous, overlap_limit)
    
            overlapped.append(
                f"{overlap} {current}".strip()
            )
    
        return overlapped

    def _get_overlap(self, text: str, max_size: int) -> str:
        if not text or max_size <= 0:
            return ""

        start = max(0, len(text) - max_size)

        # Move forward to a word boundary instead of retaining a partial word.
        if start > 0 and not text[start - 1].isspace():
            while start < len(text) and not text[start].isspace():
                start += 1
            while start < len(text) and text[start].isspace():
                start += 1

        return text[start:].strip()