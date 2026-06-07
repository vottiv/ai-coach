from abc import ABC, abstractmethod
from typing import Any, Literal

from pydantic import BaseModel


class AgentConfig(BaseModel):
    """Конфигурация агента."""

    name: str
    description: str
    model: str
    capabilities: list[Literal["text", "image", "text_image"]]
    max_tokens: int = 1000
    temperature: float = 0.7
    system_prompt: str


class AgentInput(BaseModel):
    """Входные данные для агента."""

    data: dict[str, Any]


class AgentOutput(BaseModel):
    """Выходные данные от агента."""

    content: str
    metadata: dict[str, Any] = {}


class BaseAgent(ABC):
    """Базовый класс для всех AI агентов."""

    def __init__(self, config: AgentConfig):
        self.config = config

    @abstractmethod
    async def execute(self, input_data: AgentInput) -> AgentOutput:
        """Выполнить задачу агента."""
        pass

    @abstractmethod
    def validate_input(self, input_data: AgentInput) -> bool:
        """Проверить валидность входных данных."""
        pass

    @property
    def can_process_images(self) -> bool:
        """Может ли агент обрабатывать изображения."""
        return "image" in self.config.capabilities or "text_image" in self.config.capabilities

    @property
    def can_process_text(self) -> bool:
        """Может ли агент обрабатывать текст."""
        return "text" in self.config.capabilities or "text_image" in self.config.capabilities