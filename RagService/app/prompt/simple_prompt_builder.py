from app.prompt.base import PromptBuilder

class SimplePromptBuilder(PromptBuilder):
    
    def build_prompt(
        self,
        query: str,
        context: str
    ) -> str:
        return f"""
            You are a helpful assistant answering questions based on the provided context.

            Context:
            {context}

            Question:
            {query}

            Instructions:
            - Answer the question using the provided context.
            - Do not introduce information that is not supported by the context.
            - If the answer cannot be determined from the context, clearly state that.
            - Keep the answer clear and concise.
            """.strip()