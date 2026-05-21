"""Contract checks between backend clients and internal AI services."""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path
from types import ModuleType
from typing import Type

from pydantic import BaseModel

from app.features.menu_translation import schemas as backend_menu
from app.features.place_search import schemas as backend_place_search
from app.features.rag_chat import schemas as backend_rag
from app.features.review_summary import client as backend_review_client
from app.shared import schemas as backend_shared


REPO_ROOT = Path(__file__).resolve().parents[2]


def load_module(name: str, path: Path) -> ModuleType:
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


menu_ai = load_module(
    "menu_ai_schemas",
    REPO_ROOT / "ai-models" / "menu-translation-service" / "app" / "schemas.py",
)
place_ai = load_module(
    "place_ai_schemas",
    REPO_ROOT / "ai-models" / "place-search-service" / "app" / "schemas.py",
)
rag_ai = load_module(
    "rag_ai_schemas",
    REPO_ROOT / "ai-models" / "rag-service" / "app" / "schemas.py",
)
review_ai = load_module(
    "review_ai_schemas",
    REPO_ROOT / "ai-models" / "review-summary-service" / "app" / "schemas.py",
)


def schema_properties(model: Type[BaseModel]) -> set[str]:
    return set(model.model_json_schema(mode="serialization").get("properties", {}))


def schema_required(model: Type[BaseModel]) -> set[str]:
    return set(model.model_json_schema(mode="serialization").get("required", []))


def assert_same_contract(backend_model: Type[BaseModel], ai_model: Type[BaseModel]) -> None:
    assert schema_properties(backend_model) == schema_properties(ai_model)
    assert schema_required(backend_model) == schema_required(ai_model)


def assert_backend_request_is_ai_subset(backend_model: Type[BaseModel], ai_model: Type[BaseModel]) -> None:
    assert schema_properties(backend_model).issubset(schema_properties(ai_model))
    assert schema_required(backend_model).issubset(schema_required(ai_model))


def test_menu_translation_response_contracts_match_ai_service():
    assert_same_contract(backend_menu.OCRExtractResponse, menu_ai.OCRExtractResponse)
    assert_same_contract(backend_menu.MenuResponse, menu_ai.MenuResponse)
    assert_same_contract(backend_menu.MenuCategory, menu_ai.MenuCategory)
    assert_same_contract(backend_menu.MenuItem, menu_ai.MenuItem)


def test_place_search_response_contracts_match_ai_service():
    assert_same_contract(backend_place_search.PlaceSearchImageItem, place_ai.PlaceSearchImageItem)
    assert_same_contract(backend_place_search.PlaceSearchItem, place_ai.PlaceSearchItem)
    assert_same_contract(backend_place_search.PlaceSearchResponse, place_ai.PlaceSearchResponse)


def test_rag_contracts_match_ai_service():
    assert_same_contract(backend_rag.SourcePlace, rag_ai.SourcePlace)
    assert_backend_request_is_ai_subset(backend_rag.RagChatRequest, rag_ai.RagChatRequest)
    assert_same_contract(backend_rag.RagChatResponse, rag_ai.RagChatResponse)
    assert_same_contract(backend_rag.RagRetrieveRequest, rag_ai.RagRetrieveRequest)
    assert_same_contract(backend_rag.RagRetrieveResponse, rag_ai.RagRetrieveResponse)


def test_refinement_contracts_match_rag_service_refinement_endpoint():
    assert_same_contract(backend_shared.RefineTextRequest, rag_ai.RefineTextRequest)
    assert_same_contract(backend_shared.RefineTextResponse, rag_ai.RefineTextResponse)


def test_review_summary_client_response_contracts_match_ai_service():
    assert_same_contract(backend_review_client.ReviewSummaryGenerateResponse, review_ai.ReviewSummaryGenerateResponse)
    assert_same_contract(backend_review_client.ReviewSummaryTranslateResponse, review_ai.ReviewSummaryTranslateResponse)
