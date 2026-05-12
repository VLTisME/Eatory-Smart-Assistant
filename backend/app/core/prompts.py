"""Prompt builders for the LLM refinement layer."""

from __future__ import annotations

from textwrap import dedent


MENU_REFINEMENT_PROMPT_VERSION = "menu_translation_v2"
PLACE_REFINEMENT_PROMPT_VERSION = "place_search_v1"
GENERIC_REFINEMENT_PROMPT_VERSION = "generic_refine_v1"
REVIEW_SUMMARY_PROMPT_VERSION = "review_summary_v1"
TRANSLATE_REVIEW_SUMMARY_PROMPT_VERSION = "translate_review_summary_v1"

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

    Return ONLY valid JSON with exactly two fields:
    {
      "extracted_dishes": ["<exact keyword 1>", "<exact keyword 2>"],
      "summary": "<the structured text above>"
    }

    STEP 1: EXTRACTION ("extracted_dishes")
    - Look AT ONLY the "top_positive_keywords" array.
    - Identify any keywords that name a SPECIFIC food or drink (e.g., "bánh xèo", "cốt dừa", "kem bơ", "cháo ếch", "pizza", "coffee").
    - Exclude generic terms entirely (e.g., "đồ ăn", "nước ngon", "thức uống", "nhân viên", "không gian").
    - CRITICAL: DO NOT extract any dish if it also appears or is heavily referenced in the "top_negative_keywords" array. We only want to recommend good dishes.
    - Put the exact original strings of these specific items into the "extracted_dishes" array. If none exist, leave the array empty [].

    STEP 2: SUMMARY ("summary")
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
    - If the "extracted_dishes" array from Step 1 is EMPTY, you MUST OMIT the entire 🍜 section from the summary text. Do NOT guess or fabricate dish names.
    - If the "extracted_dishes" array has items, include the 🍜 section and translate/format ONLY those extracted dishes into natural phrases in the target language.

    - Output JSON only, no markdown fences or explanation.
    """
).strip()

TRANSLATE_REVIEW_SUMMARY_PROMPT = dedent(
    """
    You are an expert translator for a food tourism assistant.
    Translate the provided structured restaurant review summary into the target language.
    
    STRICT RULES:
    - Maintain the EXACT same bullet points, formatting, and emojis.
    - Do NOT add, merge, or remove any bullet points.
    - Translate the headers appropriately. For English use:
      "📊 Overview"
      "👍 Pros (<percent>%)"
      "👎 Cons (<percent>%)"
      "🍜 Must Try:"
    - Keep percentages exactly as they are.
    - Output plain text only, no JSON, no markdown fences, no explanations.
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
    elif normalized_context in {"translate_review_summary"}:
      system_prompt = TRANSLATE_REVIEW_SUMMARY_PROMPT
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
