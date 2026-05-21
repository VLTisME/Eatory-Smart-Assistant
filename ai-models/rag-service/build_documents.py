import json
from pathlib import Path
from typing import Any, Dict, List

from rules import extract_place_signals


BASE_DIR = Path(__file__).resolve().parent
AI_MODELS_DIR = BASE_DIR.parent

# Input: find locally first, fallback to review-summary offline output
INPUT_PATH_LOCAL = BASE_DIR / "review_summaries_with_text.json"
INPUT_PATH_FALLBACK = (
    AI_MODELS_DIR
    / "review-summary-service"
    / "offline"
    / "data"
    / "output"
    / "review_summaries_with_text.json"
)
INPUT_PATH = INPUT_PATH_LOCAL if INPUT_PATH_LOCAL.exists() else INPUT_PATH_FALLBACK

OUTPUT_PATH = BASE_DIR / "rag_documents.json"


def load_json(path: Path) -> List[Dict[str, Any]]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def save_json(data: Any, path: Path) -> None:
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def safe_join(items: List[str]) -> str:
    return ", ".join(items) if items else "Không có thông tin rõ"


def format_percent(value: Any) -> str:
    if value is None:
        return "Không có thông tin"
    return f"{float(value) * 100:.0f}%"


def build_content(place: Dict[str, Any], signals: Dict[str, List[str]]) -> str:
    return f"""\
Tên: {place.get("place_name", "Không có tên")}
Loại: {safe_join(signals["derived_categories"])}
Địa chỉ: {place.get("address", "Không có thông tin")}
Khu vực: {place.get("district", "Không có thông tin")}, {place.get("city", "Không có thông tin")}
Nguồn: {place.get("source", "Không có thông tin")}

Đánh giá: {place.get("avg_rating", "Không có thông tin")}/5 từ {place.get("total_reviews_google", "Không có thông tin")} review Google Maps. Dữ liệu phân tích dùng {place.get("total_reviews_used", "Không có thông tin")} review: {format_percent(place.get("positive_ratio"))} tích cực, {format_percent(place.get("neutral_ratio"))} trung lập, {format_percent(place.get("negative_ratio"))} tiêu cực.

Review:
- Món/đồ uống được nhắc: {safe_join(signals["derived_items"])}
- Nhóm món: {safe_join(signals["derived_item_groups"])}
- Điểm mạnh: {safe_join(signals["derived_positive_aspects"])}
- Điểm yếu: {safe_join(signals["derived_negative_aspects"])}
- Mức giá: {safe_join(signals["derived_price_tags"])}
- Phù hợp: {safe_join(signals["derived_use_cases"])}

Keywords:
- Tích cực: {safe_join(signals["matched_positive_keywords"])}
- Trung lập: {safe_join(signals["matched_neutral_keywords"])}
- Tiêu cực: {safe_join(signals["matched_negative_keywords"])}"""


def build_metadata(place: Dict[str, Any], signals: Dict[str, List[str]]) -> Dict[str, Any]:
    return {
        "place_id": place.get("place_id"),
        "place_name": place.get("place_name"),
        "address": place.get("address"),
        "district": place.get("district"),
        "city": place.get("city"),
        "avg_rating": place.get("avg_rating"),
        "total_reviews_google": place.get("total_reviews_google"),
        "total_reviews_used": place.get("total_reviews_used"),
        "positive_ratio": place.get("positive_ratio"),
        "neutral_ratio": place.get("neutral_ratio"),
        "negative_ratio": place.get("negative_ratio"),
        "source": place.get("source"),
        "derived_categories": signals["derived_categories"],
        "derived_items": signals["derived_items"],
        "derived_item_groups": signals["derived_item_groups"],
        "derived_positive_aspects": signals["derived_positive_aspects"],
        "derived_negative_aspects": signals["derived_negative_aspects"],
        "derived_price_tags": signals["derived_price_tags"],
        "derived_use_cases": signals["derived_use_cases"],
    }


def build_document(place: Dict[str, Any]) -> Dict[str, Any]:
    signals = extract_place_signals(place)

    return {
        "id": place.get("place_id"),
        "content": build_content(place, signals),
        "metadata": build_metadata(place, signals),
    }


def main() -> None:
    places = load_json(INPUT_PATH)
    documents = [build_document(place) for place in places]

    save_json(documents, OUTPUT_PATH)
    print(f"Saved {len(documents)} documents to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
