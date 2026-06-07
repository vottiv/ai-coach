from typing import Literal

from app.agents.base import AgentConfig

# Текстовые модели
TEXT_MODELS = {
    "qwen-flash": "qwen/qwen-2.5-7b-instruct:free",
}

# Модели для изображений
IMAGE_MODELS = {
    "vision-flash": "google/gemini-2.5-flash-lite-preview-09-2025",
}

AGENT_CONFIGS = {
    "workout_analyzer": AgentConfig(
        name="workout_analyzer",
        description="Анализ тренировок и предоставление рекомендаций",
        model=TEXT_MODELS["qwen-flash"],
        capabilities=["text"],
        max_tokens=1500,
        temperature=0.7,
        system_prompt="Ты AI-тренер. Анализируй тренировки, давай рекомендации по улучшению, выявляй паттерны прогресса. Отвечай на русском.",
    ),
    "nutrition_analyzer": AgentConfig(
        name="nutrition_analyzer",
        description="Анализ питания и выдача рекомендаций",
        model=TEXT_MODELS["qwen-flash"],
        capabilities=["text"],
        max_tokens=1500,
        temperature=0.7,
        system_prompt="Ты AI-нутрициолог. Анализируй питание, давай рекомендации по улучшению рациона, выявляй дефициты и избытки. Отвечай на русском.",
    ),
    "food_recognizer": AgentConfig(
        name="food_recognizer",
        description="Распознавание продуктов питания с изображений",
        model=IMAGE_MODELS["vision-flash"],
        capabilities=["text_image"],
        max_tokens=2000,
        temperature=0.3,
        system_prompt="Определи продукты на изображении и оцени их количество и БЖУ. Отвечай только в формате JSON.",
    ),
    "medical_analyzer": AgentConfig(
        name="medical_analyzer",
        description="Распознавание медицинских анализов с изображений",
        model=IMAGE_MODELS["vision-flash"],
        capabilities=["text_image"],
        max_tokens=2000,
        temperature=0.3,
        system_prompt="Извлеки данные из медицинского анализа. Отвечай только в формате JSON.",
    ),
    "planner": AgentConfig(
        name="planner",
        description="Генерация персонализированных планов тренировок и питания",
        model=TEXT_MODELS["qwen-flash"],
        capabilities=["text"],
        max_tokens=2500,
        temperature=0.8,
        system_prompt="Ты AI-коуч по фитнесу. Создавай персонализированные планы тренировок и питания на основе истории и целей пользователя. Отвечай на русском.",
    ),
    "pattern_finder": AgentConfig(
        name="pattern_finder",
        description="Поиск закономерностей и трендов в данных пользователя",
        model=TEXT_MODELS["qwen-flash"],
        capabilities=["text"],
        max_tokens=2000,
        temperature=0.7,
        system_prompt="Ты AI-аналитик. Анализируй данные пользователя для поиска закономерностей, трендов и инсайтов. Отвечай на русском.",
    ),
    "chat_assistant": AgentConfig(
        name="chat_assistant",
        description="Универсальный чат-ассистент для общения с пользователем",
        model=TEXT_MODELS["qwen-flash"],
        capabilities=["text_image"],
        max_tokens=2000,
        temperature=0.8,
        system_prompt="Ты AI-помощник по фитнесу и здоровью. Отвечай на вопросы пользователя дружелюбно и профессионально на русском языке. Если пользователь загружает изображение, определи тип (еда или медицинский анализ) и используй соответствующего агента.",
    ),
}

AGENT_ROUTES = {
    "workout_analysis": "workout_analyzer",
    "nutrition_insights": "nutrition_analyzer",
    "food_recognition": "food_recognizer",
    "medical_analysis": "medical_analyzer",
    "personalized_plan": "planner",
    "pattern_analysis": "pattern_finder",
    "chat": "chat_assistant",
}