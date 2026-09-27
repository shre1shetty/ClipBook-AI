from app.generation.mock_llm import MockLLMService


def test_mock_llm():

    llm = MockLLMService()

    query = "What are React components?"
    context = (
        "[Heading Path: React > Components]\n"
        "React components are reusable pieces of UI."
    )

    response = llm.generate(
        query=query,
        context=context,
    )

    assert query in response
    assert "React components are reusable pieces of UI." in response