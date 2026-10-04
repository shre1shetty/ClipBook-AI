from app.generation.factory import LLMProviderFactory
from app.generation.generation_service import GenerationService
from app.prompt.simple_prompt_builder import SimplePromptBuilder
def test_mock_llm():

    query = "What are React components?"
    context = (
        "[Heading Path: React > Components]\n"
        "React components are reusable pieces of UI."
    )
    
    
    prompt_builder= SimplePromptBuilder()
    prompt=prompt_builder.build_prompt(query=query, context=context)
    provider = LLMProviderFactory.create()
    generation_service = GenerationService(provider=provider)
    answer = generation_service.generate(prompt=prompt)
    
    print(f"Answer : {answer}")
    
    assert "reusable pieces of UI" in answer
    
    