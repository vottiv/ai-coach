import httpx

from app.agents.base import AgentConfig, AgentInput, AgentOutput, BaseAgent


class NutritionAnalyzer(BaseAgent):
    """Агент для анализа питания."""

    async def execute(self, input_data: AgentInput) -> AgentOutput:
        nutrition_logs = input_data.data.get("nutrition_logs", [])
        user_context = input_data.data.get("user_context", {})

        messages = [
            {"role": "system", "content": self.config.system_prompt},
            {
                "role": "user",
                "content": f"""
Анализируй питание за последние {len(nutrition_logs)} дней:

Данные пользователя:
- Возраст: {user_context.get('age')}
- Цели: {', '.join(user_context.get('goals', []))}
- Уровень активности: {user_context.get('activity_level')}
- Вес: {user_context.get('weight')} кг

Логи питания:
{chr(10).join(f"- {log.get('date')}: Ккал: {log.get('calories')}, Белки: {log.get('protein')}г, Жиры: {log.get('fat')}г, Углеводы: {log.get('carbs')}г" for log in nutrition_logs)}

Дай рекомендации по:
1. Балансу БЖУ
2. Калорийности
3. Корректировке рациона
4. Подходящим продуктам
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
            "nutrition_logs" in input_data.data
            and "user_context" in input_data.data
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