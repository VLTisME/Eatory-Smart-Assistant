"""Locust scenarios for shared endpoints and menu translation OCR endpoint."""

from __future__ import annotations

from io import BytesIO

from locust import HttpUser, between, task
from PIL import Image


def build_sample_image() -> bytes:
    image = Image.new("RGB", (320, 160), color="white")
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


class MenuTranslationUser(HttpUser):
    wait_time = between(1, 3)
    image_bytes = build_sample_image()

    @task(3)
    def upload_image(self):
        self.client.post(
            "/api/v1/uploads/image",
            files={"file": ("menu.png", self.image_bytes, "image/png")},
            name="upload_image",
        )

    @task(5)
    def extract_ocr(self):
        self.client.post(
            "/api/v1/menu-translation/ocr",
            files={"file": ("menu.png", self.image_bytes, "image/png")},
            name="menu_translation_ocr",
        )

    @task(2)
    def refine_text(self):
        self.client.post(
            "/api/v1/llm/refine",
            json={
                "content": "Phở bò\n50,000 VND",
                "context": "menu_translation",
                "source_language": "vi",
                "target_language": "en",
            },
            name="llm_refine",
        )
