from abc import ABC,abstractmethod

class QueryOptimizer(ABC):
    @abstractmethod
    def optimize(self, query: str) -> str:
        pass