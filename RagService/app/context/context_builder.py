from typing import Callable
from app.context.base import ContextBuilder
from app.models.retrieved_chunk import RetrievedChunk
from app.models.built_context import BuiltContext
class SimpleContextBuilder(ContextBuilder):
    def __init__(self, count_tokens: Callable[[str], int], max_tokens: int = 2000):
        self.count_tokens = count_tokens
        self.max_tokens = max_tokens
        
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
    
    def _remove_chunk_overlaps(
        self,
        chunks: list[RetrievedChunk]
    ) -> list[RetrievedChunk]:
        if len(chunks) <= 1:
            return chunks

        result = [chunks[0]]

        for current in chunks[1:]:
            previous = result[-1]

            is_adjacent = (
                previous.chunk.notebook_id == current.chunk.notebook_id
                and previous.chunk.chunk_index + 1 == current.chunk.chunk_index
            )

            if not is_adjacent:
                result.append(current)
                continue

            cleaned_content = self._remove_overlap(
                previous.chunk.content,
                current.chunk.content,
            )

            # Fully covered by the previous chunk, so drop it together with its scores.
            if not cleaned_content:
                continue

            # Scores travel with the chunk, so dropping one never shifts the rest.
            result.append(
                current.model_copy(
                    update={
                        "chunk": current.chunk.model_copy(
                            update={"content": cleaned_content}
                        )
                    }
                )
            )

        return result

    def build(
        self,
        chunks: list[RetrievedChunk]
    ) -> BuiltContext:
        chunks = self._remove_chunk_overlaps(chunks)
        
        if not chunks:
            return BuiltContext(
                text="",
                chunks=[],
            )

        context_parts: list[str] = []
        selected_chunks: list[RetrievedChunk] = []
        seen_contents: set[str] = set()

        current_tokens = 0

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

            additional_tokens = self.count_tokens(part)

            if current_tokens + additional_tokens > self.max_tokens:
                break

            context_parts.append(part)
            selected_chunks.append(retrieved_chunk)

            current_tokens += additional_tokens

        return BuiltContext(
            text="\n\n".join(context_parts),
            chunks=selected_chunks,
        )
                
            