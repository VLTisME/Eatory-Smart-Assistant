"""Prompt builders for the LLM refinement layer."""

from __future__ import annotations

from textwrap import dedent


MENU_REFINEMENT_PROMPT_VERSION = "menu_translation_v1"


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
        system_prompt = dedent(
            """
            You are a structured data extractor and translator for restaurant menus.

            Your task:
            1. Extract menu items from OCR text
            2. Translate them into the target language
            3. Return STRICTLY valid JSON (no extra text)

            Output format:
            {
            "menu": [
                {
                "name": string,
                "price": integer
                }
            ],
            "extras": [
                {
                "name": string,
                "price": integer
                }
            ],
            "note": string
            }

            Rules:
            - Return ONLY valid JSON (no explanation, no markdown)
            - price must be integer (remove commas, currency symbols)
            - Preserve original order
            - Remove duplicate items
            - Detect "extras" (e.g., thêm, extra, add-on)
            - If no extras, return empty list []
            - If no note, return empty string ""
            - Clean OCR noise (random symbols, broken lines)
            - Fix obvious OCR mistakes
            - Translate food names naturally but accurately

            If the input is invalid or empty, return:
            {
            "menu": [],
            "extras": [],
            "note": ""
            }
            """
        ).strip()
    else:
        system_prompt = dedent(
            """
            You are a precise assistant that rewrites structured OCR or feature output.
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
