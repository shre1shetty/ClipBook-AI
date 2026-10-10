from app.context.base import ContextBuilder
from app.models.retrieved_chunk import RetrievedChunk
from app.models.chunk import Chunk
from app.models.built_context import BuiltContext
class SimpleContextBuilder(ContextBuilder):
    def __init__(self, max_characters: int = 8000):
        self.max_characters = max_characters
        
    def _remove_overlap(
        self,
        previous_content: str,
        current_content: str,
    ) -> str:
        previous_content = previous_content.rstrip()
        current_content = current_content.lstrip()

        if not previous_content or not current_content:
            return current_content

        max_overlap = min(
            len(previous_content),
            len(current_content),
        )

        # Find the longest suffix of previous_content
        # that is also a prefix of current_content.
        for overlap_length in range(max_overlap, 0, -1):
            if previous_content[-overlap_length:] == current_content[:overlap_length]:
                return current_content[overlap_length:].lstrip()

        return current_content
    
    def _remove_chunk_overlaps(self, chunks: list[Chunk]) -> list[Chunk]:
        if len(chunks) <= 1:
            return chunks

        result = [chunks[0]]

        for current in chunks[1:]:
            previous = result[-1]

            is_adjacent = previous.chunk_index + 1 == current.chunk_index
            
            if not is_adjacent:
                result.append(current)
                continue

            cleaned_content = self._remove_overlap(
                previous.content,
                current.content,
            )

            if not cleaned_content:
                continue

            cleaned_chunk = current.model_copy(
                update={"content": cleaned_content}
            )

            result.append(cleaned_chunk)

        return result

    def build(
        self,
        chunks: list[RetrievedChunk]
    ) -> BuiltContext:
        cleaned_chunks = self._remove_chunk_overlaps([chunk.chunk for chunk in chunks])
        chunks=[
            RetrievedChunk(
                chunk=cleaned_chunk,
                similarity_score=retrieved_chunk.similarity_score,
                rerank_score=retrieved_chunk.rerank_score,
            )
            for cleaned_chunk, retrieved_chunk in zip(cleaned_chunks, chunks)
        ]
        
        if not chunks:
            return BuiltContext(
                text="",
                chunks=[],
            )

        context_parts: list[str] = []
        selected_chunks: list[RetrievedChunk] = []
        seen_contents: set[str] = set()

        current_length = 0

        for retrieved_chunk in chunks:

            chunk = retrieved_chunk.chunk

            # Normalize only for duplicate detection.
            dedup_key = " ".join(chunk.content.split())

            if dedup_key in seen_contents:
                continue

            seen_contents.add(dedup_key)

            if chunk.heading_path:
                heading_path = " > ".join(chunk.heading_path)
                section = chunk.section
                part = (
                    f"[Section: {section}] \n"
                    f"[Heading Path: {heading_path}]\n"
                    f"{chunk.content}"
                )
            else:
                part = chunk.content

            additional_length = len(part)

            if current_length + additional_length > self.max_characters:
                break

            context_parts.append(part)
            selected_chunks.append(retrieved_chunk)

            current_length += additional_length

        return BuiltContext(
            text="\n\n".join(context_parts),
            chunks=selected_chunks,
        )
                
            