import httpx

from app.agents.base import AgentConfig, AgentInput, AgentOutput, BaseAgent


class Planner(BaseAgent):
    """Агент для генерации персонализированных планов."""

    async def execute(self, input_data: AgentInput) -> AgentOutput:
        user_context = input_data.data.get("user_context", {})
        history = input_data.data.get("history", {})

        messages = [
            {"role": "system", "content": self.config.system_prompt},
            {
                "role": "user",
                "content": f"""
Создай персонализированный план на основе следующей информации:

Данные пользователя:
- Имя: {user_context.get('name')}
- Возраст: {user_context.get('age')}
- Пол: {user_context.get('gender')}
- Вес: {user_context.get('weight')} кг
- Рост: {user_context.get('height')} см
- Уровень активности: {user_context.get('activity_level')}
- Цели: {', '.join(user_context.get('goals', []))}
- Локаль: {user_context.get('locale')}

История активности:
- Тренировок: {len(history.get('workouts', []))}
- Логов питания: {len(history.get('nutrition_logs', []))}
- Оценок состояния: {len(history.get('feelings', []))}

Последние показатели:
- Средний вес: {history.get('avg_weight')} кг
- Средний объём тренировки: {history.get('avg_volume')} кг
- Средние калории: {history.get('avg_calories')} ккал

Создай план, включающий:
1. Рекомендуемый график тренировок
2. Типы упражнений и примеры тренировок
3. Рекомендации по питанию (БЖУ, продукты)
4. График прогрессии
5. Маркеры успеха
6. Рекомендации по восстановлению
""",
            },
        ]

        response = await self._call_api(messages)

        return AgentOutput(
            content=response["choices"][0]["message"]["content"],
            metadata={
                "model": self.config.model,
                "agent": self.config.name,
            },
        )

    def validate_input(self, input_data: AgentInput) -> bool:
        return (
            "user_context" in input_data.data
            and "history" in input_data.data
        )

    async def _call_api(self, messages: list[dict]) -> dict:
        from app.core.config import settings

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{settings.openrouter_api_base}/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.openrouter_api_key_text}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.config.model,
                    "messages": messages,
                    "max_tokens": self.config.max_tokens,
                    "temperature": self.config.temperature,
                },
            )
            response.raise_for_status()
            return response.json()