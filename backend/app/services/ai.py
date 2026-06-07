from app.agents import AgentManager


class AIService:
    """Сервис для работы с AI через агентов."""

    def __init__(self):
        self.manager = AgentManager()

    async def analyze_workout(
        self,
        workout_data: dict,
        user_context: dict,
    ) -> str:
        """Анализировать тренировку."""
        result = await self.manager.execute(
            "workout_analyzer",
            {
                "workout_data": workout_data,
                "user_context": user_context,
            },
        )
        return result.content

    async def get_nutrition_insights(
        self,
        nutrition_logs: list[dict],
        user_context: dict,
    ) -> str:
        """Получить инсайты по питанию."""
        result = await self.manager.execute(
            "nutrition_analyzer",
            {
                "nutrition_logs": nutrition_logs,
                "user_context": user_context,
            },
        )
        return result.content

    async def recognize_food_from_image(
        self,
        image_url: str,
    ) -> dict:
        """Распознать еду с изображения."""
        result = await self.manager.execute(
            "food_recognizer",
            {"image_url": image_url},
        )
        import json

        try:
            return json.loads(result.content)
        except json.JSONDecodeError:
            return {"error": "Failed to parse response"}

    async def recognize_medical_analysis(
        self,
        image_url: str,
    ) -> dict:
        """Распознать медицинский анализ с изображения."""
        result = await self.manager.execute(
            "medical_analyzer",
            {"image_url": image_url},
        )
        import json

        try:
            return json.loads(result.content)
        except json.JSONDecodeError:
            return {"error": "Failed to parse response"}

    async def generate_personalized_plan(
        self,
        user_context: dict,
        history: dict,
    ) -> str:
        """Сгенерировать персонализированный план."""
        result = await self.manager.execute(
            "planner",
            {
                "user_context": user_context,
                "history": history,
            },
        )
        return result.content

    async def find_patterns(
        self,
        user_context: dict,
        history: dict,
    ) -> str:
        """Найти закономерности в данных."""
        result = await self.manager.execute(
            "pattern_finder",
            {
                "user_context": user_context,
                "history": history,
            },
        )
        return result.content

    async def auto_route(
        self,
        input_data: dict,
    ) -> str:
        """Автоматически выбрать агента для обработки запроса."""
        result = await self.manager.auto_route(input_data)
        return result.content

    def list_agents(self) -> list[dict]:
        """Получить список доступных агентов."""
        return self.manager.list_agents()


ai_service = AIService()