import json

import httpx

from app.agents.base import AgentConfig, AgentInput, AgentOutput, BaseAgent


class FoodRecognizer(BaseAgent):
    """Агент для распознавания продуктов питания с изображений."""

    async def execute(self, input_data: AgentInput) -> AgentOutput:
        image_url = input_data.data.get("image_url")

        prompt = """
Определи продукты на изображении и оцени их количество и БЖУ.

Формат ответа (только JSON):
{
  "products": [
    {
      "name": "название продукта",
      "quantity": "количество (граммы/шт)",
      "calories": количество ккал,
      "protein": количество белка в граммах,
      "fat": количество жиров в граммах,
      "carbs": количество углеводов в граммах
    }
  ],
  "total": {
    "calories": сумма ккал,
    "protein": сумма белков,
    "fat": сумма жиров,
    "carbs": сумма углеводов
  }
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

        print(f"FoodRecognizer: Calling API with model {self.config.model}")
        print(f"FoodRecognizer: Image URL: {messages[1]['content'][1]['image_url']['url']}")

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
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
                print(f"FoodRecognizer: API response status: {response.status_code}")
                print(f"FoodRecognizer: API response: {response.text[:500]}")
                response.raise_for_status()
                return response.json()
            except Exception as e:
                print(f"FoodRecognizer: API call failed: {e}")
                raise