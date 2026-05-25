"""Unit tests for the backend refinement service client."""

from __future__ import annotations

import json

import httpx
import pytest

from app.shared.refinement import RefinementClient, RefinementError


@pytest.mark.asyncio
async def test_refinement_client_posts_refine_request():
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/v1/refinement/refine"
        assert request.headers["authorization"] == "Bearer test-token"
        payload = json.loads(request.content.decode("utf-8"))
        assert payload == {
            "content": "Phở bò",
            "context": "generic",
            "source_language": "vi",
            "target_language": "en",
        }
        return httpx.Response(
            200,
            json={
                "refined_text": "Beef Pho",
                "source_language": "vi",
                "target_language": "en",
                "context": "generic",
                "model": "gpt-4o-mini",
                "prompt_version": "generic_refine_v1",
                "processing_time_ms": 12.5,
            },
        )

    client = RefinementClient(
        base_url="http://refinement-ai.test",
        timeout_seconds=5,
        service_token="test-token",
        transport=httpx.MockTransport(handler),
    )

    response = await client.refine(
        content="Phở bò",
        context="generic",
        source_language="vi",
        target_language="en",
    )

    assert response.refined_text == "Beef Pho"
    assert response.model == "gpt-4o-mini"
    assert response.prompt_version == "generic_refine_v1"


@pytest.mark.asyncio
async def test_refinement_client_preserves_service_error():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(500, json={"detail": "model unavailable"})

    client = RefinementClient(
        base_url="http://refinement-ai.test",
        timeout_seconds=5,
        transport=httpx.MockTransport(handler),
    )

    with pytest.raises(RefinementError) as exc_info:
        await client.refine(
            content="Phở bò",
            context="generic",
            source_language="vi",
            target_language="en",
        )

    assert exc_info.value.status_code == 502
    assert exc_info.value.detail == "model unavailable"
