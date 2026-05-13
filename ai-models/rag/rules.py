Ok, bản đơn giản cuối cùng:

```text
rag/
├── review_summaries_with_text.json   # input
├── rules.py                          # rules + extract signals
├── build_documents.py                # build document
└── rag_documents.json                # output
```

## Flow build `rag_documents.json`

```text
review_summaries_with_text.json
        ↓
build_documents.py
        ↓
với mỗi place:
    gom text từ place_name, address, summary_text, keywords
        ↓
    rules.py extract signals:
        - loại quán
        - món/đồ uống
        - nhóm món
        - điểm mạnh
        - điểm yếu
        - mức giá
        - phù hợp với nhu cầu nào
        - matched keywords
        ↓
    build content
        ↓
    build metadata
        ↓
save rag_documents.json
```

## Nội dung từng file

### `rules.py`

Chứa:

```text
- PLACE_CATEGORY_RULES
- ITEM_RULES
- POSITIVE_ASPECT_RULES
- NEGATIVE_ASPECT_RULES
- PRICE_RULES
- extract_place_signals(place)
```

Input:

```python
place
```

Output:

```python
signals = {
    "derived_categories": [...],
    "derived_item_groups": [...],
    "derived_items": [...],
    "derived_positive_aspects": [...],
    "derived_negative_aspects": [...],
    "derived_price_tags": [...],
    "derived_use_cases": [...],
    "matched_positive_keywords": [...],
    "matched_neutral_keywords": [...],
    "matched_negative_keywords": [...]
}
```

---

### `build_documents.py`

Chứa:

```text
- load input json
- gọi extract_place_signals(place)
- build content
- build metadata
- save rag_documents.json
```

Output document:

```json
{
  "id": "place_id",
  "content": "...",
  "metadata": {
    "place_id": "...",
    "place_name": "...",
    "address": "...",
    "district": "...",
    "city": "...",
    "avg_rating": 4.6,
    "total_reviews_google": 186,
    "total_reviews_used": 60,
    "positive_ratio": 0.9,
    "neutral_ratio": 0.0333,
    "negative_ratio": 0.0667,
    "source": "google_maps",
    "derived_categories": ["Nhà hàng Nhật", "Quán nướng"],
    "derived_items": ["sushi", "set lunch", "nướng"],
    "derived_item_groups": ["món Nhật", "món nướng"],
    "derived_positive_aspects": ["đồ ăn ngon", "phục vụ tốt"],
    "derived_negative_aspects": ["đợi món lâu", "giá cao"],
    "derived_price_tags": ["giá tầm trung", "giá cao"],
    "derived_use_cases": ["ăn món Nhật", "đi ăn nhóm"]
  }
}
```

## `content` format

```text
Tên: Matsuri Yaki Restaurant
Loại: Nhà hàng Nhật, quán nướng
Địa chỉ: 178 Pasteur, phường, Sài Gòn, Hồ Chí Minh
Khu vực: phường, Sài Gòn, Hồ Chí Minh
Nguồn: Google Maps

Đánh giá: 4.6/5 từ 186 review Google Maps. Dữ liệu phân tích dùng 60 review: 90% tích cực, 3% trung lập, 7% tiêu cực.

Review:
- Món/đồ uống được nhắc: sushi, set lunch, nướng
- Nhóm món: món Nhật, món nướng
- Điểm mạnh: đồ ăn ngon, phục vụ tốt, nhân viên thân thiện, không gian yên tĩnh, giá hợp lý
- Điểm yếu: đợi món lâu, giá cao, vấn đề đơn online/giao hàng
- Mức giá: giá tầm trung, giá cao
- Phù hợp: ăn món Nhật, đi ăn nhóm, ăn trưa

Keywords:
- Tích cực: phục vụ nhiệt, đồ ăn ngon, ăn ngon, món ăn ngon, viên thân thiện, gian yên tĩnh, trang trí đẹp, trải nghiệm tuyệt, giá cả phải chăng
- Trung lập: set lunch, sạch lịch sự, giá tầm 200k, đông người phục
- Tiêu cực: đợi hơn 30p, shipper nhận đơn, ăn sushi hoặc, nướng thôi thực, hết 4tr6 ăn, ai bảo rẻ, dở tệ mang
```

## Chốt lại

Bước 1 chỉ cần:

```text
review_summaries_with_text.json
        ↓
rules.py + build_documents.py
        ↓
rag_documents.json
```

Đơn giản, dễ code, dễ giải thích, đủ tốt để sang bước build vector DB.

