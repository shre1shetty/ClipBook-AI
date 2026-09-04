from app.query.simple_optimizer import SimpleQueryOptimizer

def test_query_optimizer():
    optimizer = SimpleQueryOptimizer()
    
    query = "   What   are   React   components?   "

    optimized_query = optimizer.optimize(query)

    assert optimized_query == "What are React components?"