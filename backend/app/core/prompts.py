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
    elif normalized_context in {"place_search", "place search", "image_search", "image search"}:
      system_prompt = PLACE_SEARCH_STRUCTURED_PROMPT
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
