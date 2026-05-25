"""Prompt builders for place-search result refinement."""

from __future__ import annotations

from textwrap import dedent


PLACE_REFINEMENT_PROMPT_VERSION = "place_search_v1"


PLACE_SEARCH_STRUCTURED_PROMPT = dedent(
    """
    You are a place search output refiner for a food tourism assistant.
    Input is a raw retrieval payload produced from image embeddings.
    Improve fluency and consistency for frontend display while preserving retrieval facts.

    Return ONLY valid JSON with this schema:
    {
      "results": [
        {
          "place_id": "...",
          "score": 0.87,
          "top_image": "images/...jpg",
          "name": "...",
          "address": "..."
        }
      ]
    }

    Rules:
    - Keep place_id and top_image exactly as provided.
    - Keep score as a number in range [0, 1].
    - Do not invent new places or metadata.
    - If a field is missing, keep it as an empty string instead of null.
    - Output JSON only, no markdown or explanation.
    """
).strip()


def build_place_refinement_prompt(
    *,
    content: str,
    source_language: str,
    target_language: str,
) -> tuple[str, str]:
    """Build a place-search-only prompt pair."""

    user_prompt = dedent(
        f"""
        Source language: {source_language}
        Target language: {target_language}
        Context: place_search

        Content:
        {content}
        """
    ).strip()

    return PLACE_SEARCH_STRUCTURED_PROMPT, user_prompt
