import json

import httpx

from app.agents.base import AgentConfig, AgentInput, AgentOutput, BaseAgent


class MedicalAnalyzer(BaseAgent):
    """Агент для распознавания медицинских анализов с изображений."""

    async def execute(self, input_data: AgentInput) -> AgentOutput:
        image_url = input_data.data.get("image_url")

        prompt = """
Извлеки данные из медицинского анализа.

Формат ответа (только JSON):
{
  "analysis_type": "тип анализа",
  "parameters": [
    {
      "name": "название параметра",
      "value": "значение",
      "unit": "единица измерения",
      "reference": "референсные значения",
      "status": "normal/high/low"
    }
  ],
  "summary": "краткое резюме"
}
"""

        messages = [
            {"role": "system", "content": self.config.system_prompt},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": image_url}},
                ],
            },
        ]

        response = await self._call_api(messages)

        content = response["choices"][0]["message"]["content"]

        try:
            parsed = json.loads(content)
            return AgentOutput(
                content=json.dumps(parsed),
                metadata={
                    "model": self.config.model,
                    "agent": self.config.name,
                },
            )
        except json.JSONDecodeError:
            return AgentOutput(
                content=json.dumps({"error": "Failed to parse AI response", "raw_content": content}),
                metadata={
                    "model": self.config.model,
                    "agent": self.config.name,
                },
            )

    def validate_input(self, input_data: AgentInput) -> bool:
        return "image_url" in input_data.data

    async def _call_api(self, messages: list[dict]) -> dict:
        from app.core.config import settings

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{settings.openrouter_api_base}/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.openrouter_api_key_image}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.config.model,
                    "messages": messages,
                    "max_tokens": self.config.max_tokens,
                },
            )
            response.raise_for_status()
            return response.json()