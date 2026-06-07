from typing import Any

from app.agents.base import AgentInput, AgentOutput, BaseAgent
from app.agents.config import AGENT_CONFIGS
from app.agents.food_recognizer import FoodRecognizer
from app.agents.medical_analyzer import MedicalAnalyzer
from app.agents.nutrition_analyzer import NutritionAnalyzer
from app.agents.pattern_finder import PatternFinder
from app.agents.planner import Planner
from app.agents.workout_analyzer import WorkoutAnalyzer


class AgentFactory:
    """Фабрика для создания агентов."""

    _agents: dict[str, type[BaseAgent]] = {
        "workout_analyzer": WorkoutAnalyzer,
        "nutrition_analyzer": NutritionAnalyzer,
        "food_recognizer": FoodRecognizer,
        "medical_analyzer": MedicalAnalyzer,
        "planner": Planner,
        "pattern_finder": PatternFinder,
    }

    @classmethod
    def create(cls, agent_name: str) -> BaseAgent:
        """Создать агент по имени."""
        agent_class = cls._agents.get(agent_name)
        if agent_class is None:
            raise ValueError(f"Unknown agent: {agent_name}")

        config = AGENT_CONFIGS.get(agent_name)
        if config is None:
            raise ValueError(f"No config found for agent: {agent_name}")

        return agent_class(config)

    @classmethod
    def register_agent(cls, name: str, agent_class: type[BaseAgent]) -> None:
        """Зарегистрировать нового агента."""
        cls._agents[name] = agent_class


class AgentManager:
    """Менеджер для оркестрации агентов."""

    def __init__(self):
        self.factory = AgentFactory()

    async def execute(
        self,
        agent_name: str,
        input_data: dict[str, Any],
    ) -> AgentOutput:
        """Выполнить задачу с помощью агента."""
        agent = self.factory.create(agent_name)
        agent_input = AgentInput(data=input_data)

        if not agent.validate_input(agent_input):
            raise ValueError(f"Invalid input for agent: {agent_name}")

        return await agent.execute(agent_input)

    async def execute_with_fallback(
        self,
        agent_names: list[str],
        input_data: dict[str, Any],
    ) -> AgentOutput:
        """Выполнить задачу с fallback на других агентов."""
        for agent_name in agent_names:
            try:
                return await self.execute(agent_name, input_data)
            except Exception as e:
                print(f"Agent {agent_name} failed: {e}")
                continue

        raise RuntimeError("All agents failed")

    async def auto_route(
        self,
        input_data: dict[str, Any],
    ) -> AgentOutput:
        """Автоматически выбрать агент для обработки запроса."""
        if "image_url" in input_data:
            return await self._route_image_input(input_data)
        elif "workout_data" in input_data:
            return await self.execute("workout_analyzer", input_data)
        elif "nutrition_logs" in input_data:
            return await self.execute("nutrition_analyzer", input_data)
        elif "history" in input_data and "user_context" in input_data:
            return await self.execute("pattern_finder", input_data)
        else:
            raise ValueError("Cannot auto-route: unknown input format")

    async def _route_image_input(self, input_data: dict[str, Any]) -> AgentOutput:
        """Выбрать агента для обработки изображения."""
        hint = input_data.get("hint", "")

        if "food" in hint.lower() or "еда" in hint.lower() or "meal" in hint.lower():
            return await self.execute("food_recognizer", input_data)
        elif "analysis" in hint.lower() or "анализ" in hint.lower() or "medical" in hint.lower():
            return await self.execute("medical_analyzer", input_data)
        else:
            return await self.execute_with_fallback(
                ["food_recognizer", "medical_analyzer"],
                input_data,
            )

    def list_agents(self) -> list[dict[str, Any]]:
        """Получить список доступных агентов."""
        return [
            {
                "name": name,
                "description": config.description,
                "model": config.model,
                "capabilities": config.capabilities,
            }
            for name, config in AGENT_CONFIGS.items()
        ]