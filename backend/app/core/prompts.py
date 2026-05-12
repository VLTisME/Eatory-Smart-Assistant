"""Prompt builders for the LLM refinement layer."""

from __future__ import annotations

from textwrap import dedent


MENU_REFINEMENT_PROMPT_VERSION = "menu_translation_v2"
PLACE_REFINEMENT_PROMPT_VERSION = "place_search_v1"
GENERIC_REFINEMENT_PROMPT_VERSION = "generic_refine_v1"
REVIEW_SUMMARY_PROMPT_VERSION = "review_summary_v1"

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

REVIEW_SUMMARY_STRUCTURED_PROMPT = dedent(
    """
    You are a restaurant review summarizer for a food tourism assistant.
    Input is a JSON containing the place name, positive/negative ratio,
    and top keywords extracted from real customer reviews.

    Your task is to produce a structured summary that a frontend can
    render directly.  Use the format below — each section on its own line,
    bullet items separated by newlines.  Do NOT use markdown headers or
    bold syntax.

    Format:
    📊 <overall_header>
    👍 <positive_label> (<positive_percent>%)
    <bullet 1>
    <bullet 2>
    ...
    👎 <negative_label> (<negative_percent>%)
    <bullet 1>
    <bullet 2>
    ...
    🍜 <must_try_label>:
    <bullet 1>
    <bullet 2>
    ...

    LANGUAGE HEADERS — replace placeholders with the correct translation:
    | placeholder        | vi (Vietnamese)       | en (English)  |
    |--------------------|-----------------------|---------------|
    | <overall_header>   | Tổng quan đánh giá    | Overview      |
    | <positive_label>   | Khen                  | Pros          |
    | <negative_label>   | Chê                   | Cons          |
    | <must_try_label>   | Món nên thử           | Must Try      |
    For any other language, translate these labels appropriately.

    Return ONLY valid JSON:
    {
      "summary": "<the structured text above>"
    }

    STRICT RULES:
    - Use the target language from the user prompt for ALL labels and bullet text.
    - Percentages must match the ratios in the input (rounded to integer).
    - Every bullet in 👍 must be derived from "top_positive_keywords" ONLY.
    - Every bullet in 👎 must be derived from "top_negative_keywords" ONLY.
    - Turn raw keywords into natural phrases in the target language.
      (e.g. vi: "nhân viên" + "thân thiện" → "Nhân viên thân thiện")
      (e.g. en: "nhân viên" + "thân thiện" → "Friendly staff")
    - Each bullet is one concise phrase (≤ 10 words).
    - Maximum 3-4 bullets per section. Pick the most important ones.
    - MERGE overlapping or similar keywords into ONE bullet.
      e.g. "dễ thương" + "thân thiện" → one bullet about friendly staff
      e.g. "đồ uống" + "nước ngon" → one bullet about good drinks
    - No two bullets may express the same meaning.
    - NEVER invent information that is not in the provided keywords.

    RULES FOR 🍜 <must_try_label>:
    - ONLY include this section if "top_positive_keywords" contains
      a real food or drink name (e.g. "phở", "bánh kem", "matcha",
      "bingsu", "cà phê", "chè mè đen", "trà sữa", "chiên gà").
    - Generic words like "đồ ăn", "ăn ngon", "đồ uống", "nước ngon",
      "nhân viên", "view đẹp" are NOT dish names — do NOT use them.
    - If NO specific dish/drink name exists in the keywords, OMIT the
      entire 🍜 section.  Do NOT guess or fabricate dish names.
    - Dish names in the bullet should be written in the target language.

    - Output JSON only, no markdown fences or explanation.
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
    elif normalized_context in {"review_summary", "review summary"}:
      system_prompt = REVIEW_SUMMARY_STRUCTURED_PROMPT
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
