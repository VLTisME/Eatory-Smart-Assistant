"""Prompt builders for the LLM refinement layer."""

from __future__ import annotations

from textwrap import dedent


MENU_REFINEMENT_PROMPT_VERSION = "menu_translation_v2"

MENU_STRUCTURED_PROMPT = dedent(
    """
    You are a Vietnamese menu OCR normalizer and translator.
    Input is noisy OCR text. Correct obvious OCR spelling/diacritic mistakes while preserving meaning.
    Merge wrapped lines when they clearly belong to one dish line.
    Keep prices and category structure faithful to source.

    Return ONLY valid JSON with this schema:
    {
      "restaurantInfo": {"id": "...", "name": "...", "phoneNumber": null, "address": ""},
      "categories": [
        {
          "id": "...",
          "title": "<original>",
          "translation": "<target language>",
          "items": [
            {
              "id": "...",
              "name": "<corrected original>",
              "translation": "<target language>",
              "description": null,
              "priceType": "fixed|variable|market_price",
              "basePrice": 50000,
              "priceText": null,
              "priceOptions": [],
              "tags": [],
              "modifierGroups": []
            }
          ]
        }
      ]
    }

    Rules:
    - Use VND integer for basePrice (e.g., 30k -> 30000).
    - Default priceType to "fixed" if uncertain.
    - Never output null for tags, priceOptions, modifierGroups.
    - Output JSON only, no markdown or explanation.
    """
).strip()


def build_refinement_prompt(
    *,
    content: str,
    context: str,
    source_language: str,
    target_language: str,
) -> tuple[str, str]:
    """Build a system and user prompt pair for the refinement LLM."""

    normalized_context = context.strip().lower()

    if normalized_context in {"menu", "menu_translation", "menu translation", "ocr_menu"}:
        system_prompt = MENU_STRUCTURED_PROMPT
    else:
        system_prompt = dedent(
            """
            You are a precise assistant that rewrites structured OCR or feature output.
            The data contains a lot of gramatical errors, so fix that problem.
            Preserve all facts, avoid hallucinations, and return only the refined result.
            """
        ).strip()

    user_prompt = dedent(
        f"""
        Source language: {source_language}
        Target language: {target_language}
        Context: {context}

        Content:
        {content}
        """
    ).strip()

    return system_prompt, user_prompt
