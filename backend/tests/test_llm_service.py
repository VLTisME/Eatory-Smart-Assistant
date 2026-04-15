"""Unit tests for the OpenAI refinement service."""

from __future__ import annotations

from types import SimpleNamespace

import pytest

import app.core.prompts as prompts_module
import app.shared.refinement as refinement_module


def test_build_refinement_prompt_mentions_translation_rules():
    system_prompt, user_prompt = prompts_module.build_refinement_prompt(
        content="Phở bò",
        context="menu_translation",
        source_language="vi",
        target_language="en",
    )

    assert "Vietnamese menu data extractor and spell-checker" in system_prompt
    assert "Return ONLY valid JSON" in system_prompt
    assert "Phở bò" in user_prompt
    assert "Source language: vi" in user_prompt
    assert "Target language: en" in user_prompt


def test_llm_service_raises_without_api_key(monkeypatch):
    monkeypatch.setattr(refinement_module.settings, "openai_api_key", None)

    with pytest.raises(refinement_module.RefinementError):
        refinement_module.RefinementClient()


def test_llm_service_refines_text(monkeypatch):
    monkeypatch.setattr(refinement_module.settings, "openai_api_key", "test-key")
    monkeypatch.setattr(refinement_module.settings, "openai_model", "gpt-4o-mini")

    class FakeCompletions:
        def create(self, *, model, temperature, messages):
            assert model == "gpt-4o-mini"
            assert temperature == 0.2
            assert messages[0]["role"] == "system"
            return SimpleNamespace(
                choices=[SimpleNamespace(message=SimpleNamespace(content="Beef Pho\nPrice: 50,000 VND"))]
            )

    class FakeClient:
        def __init__(self, api_key):
            self.chat = SimpleNamespace(completions=FakeCompletions())

    monkeypatch.setattr(refinement_module, "OpenAI", FakeClient)

    client = refinement_module.RefinementClient()
    refined_text, processing_time_ms, prompt_version = client.refine(
        content="Phở bò",
        context="menu_translation",
        source_language="vi",
        target_language="en",
    )

    assert refined_text == "Beef Pho\nPrice: 50,000 VND"
    assert processing_time_ms >= 0
    assert prompt_version == "menu_translation_v2"