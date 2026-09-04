import re
from app.query.base import QueryOptimizer

class SimpleQueryOptimizer(QueryOptimizer):
    def optimize(self, query:str)->str:
        query=query.strip()
        
        query=re.sub(r"\s+", " ", query)

        return query
        
    