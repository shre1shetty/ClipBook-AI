import re
import uuid
from typing import Callable
from app.chunking.base import Chunker
from app.models.document import DocumentRequest
from app.models.chunk import Chunk


class DocumentChunker(Chunker):
    def __init__(
        self,
        count_tokens:Callable[[str],int],
        chunk_size:int=256, # max tokens of chunk content
        chunk_overlap:int=40 # tokens
    ): #constructor
        if chunk_overlap>=chunk_size:
            raise ValueError("chunk_overlap must be smaller than chunk_size")
        self.count_tokens=count_tokens
        self.chunk_size=chunk_size
        self.chunk_overlap=chunk_overlap
    
    def chunk(self,document:DocumentRequest)->list[Chunk]:
        sections=self._extract_sections(document.content)
        
        chunks:list[Chunk]=[]
        
        for section in sections:
            content=section["content"]
            
            # If chunk is already small enough.
            if self.count_tokens(content) <= self.chunk_size:
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
        if self.count_tokens(text)<=self.chunk_size:
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
            
            if self.count_tokens(candidate)<=self.chunk_size:
                current=candidate
                continue
            
            # Current piece have value
            
            if current.strip():
                chunks.append(current.strip())
            
            # If length of individual part is greater than chunk size
            
            if self.count_tokens(segment)> self.chunk_size:
                nested_chunks=self._split_recursive(segment,seperators[1:])
                chunks.extend(nested_chunks)
                current=''
            else:
                current=segment
        
        if current.strip():
            chunks.append(current.strip())

        return chunks
        
    def _hard_split(self,text:str)->list[str]:
        # Last option when no seperator is useful: largest prefix that fits the token budget
        chunks:list[str]=[]
        start=0
        
        while start < len(text):
            # Binary search for the furthest end that still fits chunk_size tokens
            low,high=start+1,len(text)
            while low<high:
                mid=(low+high+1)//2
                if self.count_tokens(text[start:mid])<=self.chunk_size:
                    low=mid
                else:
                    high=mid-1
            end=low
            
            # Prefer cutting at whitespace so words are not split
            if end<len(text):
                space=text.rfind(" ",start+1,end)
                if space>start:
                    end=space
            
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
    
            # Token room left in this chunk for the overlap.
            available_tokens = self.chunk_size - self.count_tokens(current)
    
            if available_tokens <= 0:
                overlapped.append(current)
                continue
    
            overlap_limit = min(
                self.chunk_overlap,
                available_tokens
            )
    
            overlap = self._get_overlap(previous, overlap_limit)
    
            overlapped.append(
                f"{overlap} {current}".strip()
            )
    
        return overlapped

    def _get_overlap(self, text: str, max_tokens: int) -> str:
        if not text or max_tokens <= 0:
            return ""

        # Take whole words from the end while they still fit in max_tokens.
        words = text.split()
        start = len(words)

        while start > 0:
            candidate = " ".join(words[start - 1:])
            if self.count_tokens(candidate) > max_tokens:
                break
            start -= 1

        return " ".join(words[start:])
