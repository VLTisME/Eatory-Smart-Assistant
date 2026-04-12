"""Prompt builders for the LLM refinement layer."""

from __future__ import annotations

from textwrap import dedent


MENU_REFINEMENT_PROMPT_VERSION = "menu_translation_v2"

MENU_STRUCTURED_PROMPT = dedent("""
You are a Vietnamese menu data extractor and spell-checker.
You receive RAW OCR text from a restaurant menu image. OCR often produces MISSPELLED Vietnamese words.

YOUR #1 PRIORITY: Fix all OCR spelling errors before outputting.

Common OCR mistakes to fix:
- "Ml" → "Mì", "Trôn" → "Trộn", "Xúc Xich" → "Xúc Xích"
- "Nudng" → "Nướng", "Dả" → "Đá", "Nưởng" → "Nướng"
- "Bảnh" → "Bánh", "Phô" → "Phô" (or "Phở" depending on context)
- "Déo" → "Dẻo", "Thỗt Nõt" → "Thốt Nốt"
- "STa" → "Sữa", "Topplng" → "Topping", "MỈx" → "Mix"
- "Gombo" → "Combo", "Chien" → "Chiên"
- "Che" → "Chè", "Mùa" → "4 Mùa" (if context suggests)
- Missing diacritics: always add correct Vietnamese diacritics (ă, â, đ, ê, ô, ơ, ư, ...)
- Contextual shorthand: "Cà đen" → "Cà phê đen", "Cà sữa" → "Cà phê sữa", "Cà trứng" → "Cà phê trứng".
- CUISINE KNOWLEDGE: You have vast knowledge of Vietnamese cuisine. If a string is garbled but visually resembles a common Vietnamese dish or drink, confidently correct it (e.g., "Sia C1iua" → "Sữa chua", "Sinh Tố Bơ" → "Sinh Tố Bơ"). Look at the character shapes OCR typically confuses (e.g., 1 and l/i, 0 and o, C and G, v and y).
- LINE WRAPPING (IMPORTANT): OCR text often splits long dish names across multiple lines (e.g., "Trà tắc" on one line, "xí muội 20k" on the next line). If a line looks like the continuation of the previous dish (especially if it lacks a price or makes no sense alone), MERGE THEM into a single name (e.g., "Trà tắc xí muội"). Do NOT separate them into two different items.

Output a JSON object matching this EXACT schema:

{
  "restaurantInfo": {
    "id": "res_001",
    "name": "<restaurant name> (or 'Unknown')",
    "phoneNumber": "<phone> (or null)",
    "address": "<address> (or '')"
  },
  "categories": [
    {
      "id": "cat_01",
      "title": "<original category name>",
      "translation": "<translate title to Target Language>",
      "items": [
        {
          "id": "item_001",
          "name": "<CORRECTED original dish name>",
          "translation": "<translate dish name to Target Language>",
          "description": "<description or null>",
          "priceType": "fixed",
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
- MOST IMPORTANT: Every dish name MUST be in correct, properly-spelled original language.
- TRANSLATION: You MUST accurately translate the Category `title` and Dish `name` into the required `Target language`. Provide the translation in the `translation` field.
- If OCR missed prices but you can infer from context (e.g., numbers nearby), include them.
- priceType = "fixed" when there is exactly 1 price. Default to "fixed" if unsure.
- priceType = "variable" when there are multiple size/options.
- priceType = "market_price" when the menu says "thời giá", "liên hệ", etc.
- priceType MUST NEVER be null.
- basePrice unit = VND (e.g., 50000 not 50). If menu shows "30" → basePrice = 30000.
- tags MUST be [] if empty, NEVER null.
- modifierGroups MUST be [] if empty, NEVER null.
- priceOptions MUST be [] if empty, NEVER null.
- Return ONLY valid JSON. No explanation, no markdown, no extra text.
""").strip()


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
