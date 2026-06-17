import json
import logging
import re
from typing import Any

import httpx

from app.config import settings
from app.prompts.prompts import (
    EVALUATION_SYSTEM_PROMPT,
    EXAM_SUMMARY_PROMPT,
    build_client_prompt,
    build_evaluation_prompt,
)


logger = logging.getLogger("izo_coach.groq")


class GroqService:
  def __init__(self):
    self.api_key = settings.groq_api_key
    self.model = settings.groq_model
    self.base_url = "https://api.groq.com/openai/v1"
    self.proxy = settings.groq_http_proxy or None

  async def _chat(
    self,
    messages: list[dict[str, str]],
    temperature: float = 0.7,
    max_tokens: int = 1024,
  ) -> str:
    if not self.api_key:
      raise ValueError("GROQ_API_KEY is not configured")

    async with httpx.AsyncClient(timeout=60.0, proxy=self.proxy) as client:
      response = await client.post(
        f"{self.base_url}/chat/completions",
        headers={
          "Authorization": f"Bearer {self.api_key}",
          "Content-Type": "application/json",
          "User-Agent": "IZO-Coach/1.0",
        },
        json={
          "model": self.model,
          "messages": messages,
          "temperature": temperature,
          "max_tokens": max_tokens,
        },
      )
      if response.status_code >= 400:
        body = response.text[:500]
        raise ValueError(f"Groq API {response.status_code}: {body}")
      data = response.json()
      return data["choices"][0]["message"]["content"].strip()

  async def get_client_response(
    self,
    scenario_title: str,
    scenario_description: str,
    client_role: str,
    ai_behavior_prompt: str,
    dialogue_messages: list[dict[str, str]],
  ) -> str:
    system_prompt = build_client_prompt(
      scenario_title, scenario_description, client_role, ai_behavior_prompt
    )
    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(dialogue_messages)
    return await self._chat(messages, temperature=0.8)

  async def evaluate_dialogue(
    self,
    scenario_title: str,
    scenario_description: str,
    evaluation_criteria: str | None,
    dialogue_messages: list[dict[str, str]],
  ) -> dict[str, Any]:
    dialogue_text = "\n".join(
      f"{'Менеджер' if m['role'] == 'user' else 'Клиент'}: {m['content']}"
      for m in dialogue_messages
      if m["role"] in ("user", "assistant")
    )
    user_prompt = build_evaluation_prompt(
      scenario_title, scenario_description, evaluation_criteria, dialogue_text
    )
    messages = [
      {"role": "system", "content": EVALUATION_SYSTEM_PROMPT},
      {"role": "user", "content": user_prompt},
    ]
    raw = await self._chat(messages, temperature=0.3, max_tokens=2048)
    return self._parse_json(raw)

  async def summarize_exam(self, case_results: list[dict[str, Any]]) -> dict[str, Any]:
    user_content = json.dumps(case_results, ensure_ascii=False, indent=2)
    messages = [
      {"role": "system", "content": EXAM_SUMMARY_PROMPT},
      {"role": "user", "content": user_content},
    ]
    raw = await self._chat(messages, temperature=0.3, max_tokens=1024)
    return self._parse_json(raw)

  def _parse_json(self, raw: str) -> dict[str, Any]:
    # Strip markdown code fences if present
    cleaned = raw.strip()
    if cleaned.startswith("```"):
      cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
      cleaned = re.sub(r"\s*```$", "", cleaned)
    try:
      return json.loads(cleaned)
    except json.JSONDecodeError:
      match = re.search(r"\{.*\}", cleaned, re.DOTALL)
      if match:
        return json.loads(match.group())
      raise ValueError(f"Failed to parse AI response as JSON: {raw[:200]}")


groq_service = GroqService()
