import logging
import re
import uuid
from app.chunking.base import Chunker
from app.models.document import DocumentRequest
from app.models.chunk import Chunk

logger = logging.getLogger(__name__)

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
            logger.debug(
                "Processing section heading_path=%s content_length=%s",
                section["heading_path"],
                len(content),
            )
            
            # If chunk is already small enough.
            if len(content) <= self.chunk_size:
                split_contents = [content]
            
            # If chunk is greater than size split recursively
            else:
                split_contents = self._recursive_split(content)
                logger.debug(
                    "Section %s split into %s chunk(s)",
                    section["heading_path"],
                    len(split_contents),
                )
            
            for content_part in split_contents:
                chunks.append(
                    Chunk(
                        id=str(uuid.uuid4()),
                        document_id=document.document_id,
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
    
        logger.info(
            "Document %s chunking complete: %s chunk(s) created",
            document.document_id,
            len(chunks),
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
                logger.debug("Detected heading at level %s: %s", level, heading)
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
        logger.debug("Extracted %s section(s) from markdown content", len(sections))
        return sections
    def _recursive_split(self,text:str)->list[str]:
        seperators=[
            "\n\n",
            "\n",
            ". ",
            " "
        ]
        logger.debug("Recursively splitting text of length %s using separators %s", len(text), seperators)
        
        return self._split_recursive(text=text.strip(),seperators=seperators)
    
    def _split_recursive(self,text:str,seperators:list[str])->list[str]:
        # If this piece is already small enough, no further splitting is necessary
        if len(text)<=self.chunk_size:
            return [text]
        
        # Recursively call _split_recursive till chunk is less than equal to chunk_size
        
        if not seperators:
            logger.debug("No suitable separator left for text length %s; falling back to hard split", len(text))
            return self._hard_split(text)
        
        seperator=seperators[0]
        
        parts=text.split(seperator)
        
        #If seperator doesnt split anything try next seperator
        if len(parts)==1:
            logger.debug("Separator '%s' did not split text; trying next separator", seperator)
            return self._split_recursive(text,seperators[1:]) # return every element of list except 1st

        chunks:list[str]=[]
        current:str=''
        
        for part in parts:
            # if current is falsy then candidate = part else current + seperator + part
            candidate=(
                part
                if not current
                else current + seperator + part
            )
            
            if len(candidate)<=self.chunk_size:
                current=candidate
                continue
            
            # Current piece have value
            
            if current.strip():
                chunks.append(current.strip())
            
            # If length of individual part is greater than chunk size
            
            if len(part)> self.chunk_size:
                nested_chunks=self._recursive_split(part,seperators[1:])
                chunks.extend(nested_chunks)
                current=''
            else:
                current=part
        
        if current.strip():
            chunks.append(current.strip())

        logger.debug("Recursive split produced %s chunk(s) before overlap handling", len(chunks))
        return self._apply_overlap(chunks)
        
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
        logger.debug("Hard split produced %s chunk(s) for text length %s", len(chunks), len(text))
        return self._apply_overlap(chunks)
            
    def _apply_overlap(self, chunks: list[str]) -> list[str]:
        if len(chunks) <= 1:
            return chunks
    
        overlapped: list[str] = [chunks[0]]
    
        for i in range(1, len(chunks)):
            previous = chunks[i - 1]
            current = chunks[i]
    
            available_space = self.chunk_size - len(current)
    
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
    
        logger.debug("Applied overlap to %s chunk(s); final chunk count=%s", len(chunks), len(overlapped))
        return overlapped

    def _get_overlap(self, text: str, max_size: int) -> str:
        """
        Get meaningful overlap from the end of the previous chunk.

        Preference:
        1. Complete sentences that fit within max_size.
        2. If no complete sentence fits, use up to max_size
        characters ending at a word boundary.
        """

        if not text or max_size <= 0:
            return ""

        # Take the tail we're allowed to use.
        candidate = text[-max_size:]

        # Look for complete sentences inside the candidate.
        sentences = re.findall(
            r'[^.!?]*[.!?]',
            candidate,
            flags=re.DOTALL
        )

        if sentences:
            overlap = "".join(sentences).strip()

            # Make sure we're not accidentally exceeding the limit.
            if len(overlap) <= max_size:
                return overlap

        # No complete sentence fits.
        # Use the last max_size characters, but don't start
        # in the middle of a word.
        if len(candidate) == len(text):
            return candidate.strip()

        # candidate may start halfway through a word.
        first_space = candidate.find(" ")

        if first_space != -1:
            candidate = candidate[first_space + 1:]

        return candidate.strip()