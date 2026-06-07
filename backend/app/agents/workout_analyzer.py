import json

import httpx

from app.agents.base import AgentConfig, AgentInput, AgentOutput, BaseAgent


class WorkoutAnalyzer(BaseAgent):
    """Агент для анализа тренировок."""

    async def execute(self, input_data: AgentInput) -> AgentOutput:
        workout_data = input_data.data.get("workout_data", {})
        user_context = input_data.data.get("user_context", {})

        messages = [
            {"role": "system", "content": self.config.system_prompt},
            {
                "role": "user",
                "content": f"""
Анализируй тренировку:

Данные пользователя:
- Возраст: {user_context.get('age')}
- Цели: {', '.join(user_context.get('goals', []))}
- Уровень активности: {user_context.get('activity_level')}
- История тренировок: {len(user_context.get('workout_history', []))} тренировок

Данные тренировки:
- Дата: {workout_data.get('date')}
- Тип: {workout_data.get('type')}
- Упражнения: {len(workout_data.get('exercises', []))}
- Общая длительность: {workout_data.get('duration_min')} минут
- Общий объём: {workout_data.get('total_volume')} кг

Упражнения:
{chr(10).join(f"- {ex.get('name')}: {ex.get('sets')} подходов, {ex.get('reps')} повторений, {ex.get('weight')} кг" for ex in workout_data.get('exercises', []))}

Дай рекомендации по:
1. Технике выполнения
2. Нагрузке и прогрессии
3. Отдыху между тренировкам
4. Корректировке плана
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
            "workout_data" in input_data.data
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