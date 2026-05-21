"""
rules.py - Extract signals from place data for RAG document building.

Chứa các rules dict và hàm extract_place_signals(place) để phân loại
loại quán, món/đồ uống, điểm mạnh, điểm yếu, mức giá, use cases
từ keywords và thông tin review.
"""

from typing import Any, Dict, List, Set
import unicodedata


# ---------------------------------------------------------------------------
# RULES: mỗi rule là dict { label -> list[keyword patterns] }
# Keyword patterns đã được normalize (bỏ dấu) để match với text đã normalize.
# ---------------------------------------------------------------------------

PLACE_CATEGORY_RULES: Dict[str, List[str]] = {
    "Quán cà phê": [
        "ca phe", "cafe", "cf ", "coffee", "capuchino", "cappuccino",
        "espresso", "latte", "americano",
    ],
    "Quán trà sữa": [
        "tra sua", "milk tea", "boba", "topping tran chau",
    ],
    "Quán nước ép / sinh tố": [
        "nuoc ep", "sinh to", "smoothie", "juice", "detox",
    ],
    "Quán trà": [
        "tra dao", "tra chanh", "tra sen", "tra hoa", "tra o long",
        "tra xanh", "tra da",
    ],
    "Nhà hàng": [
        "nha hang", "restaurant", "bistro",
    ],
    "Nhà hàng Nhật": [
        "sushi", "sashimi", "ramen", "tempura", "takoyaki", "matcha",
        "nhat ban", "japanese", "yakiniku", "yaki",
    ],
    "Nhà hàng Hàn": [
        "korean", "han quoc", "kimchi", "bibimbap", "tokbokki",
        "tteokbokki", "ga ran han", "samgyeopsal",
    ],
    "Nhà hàng Thái": [
        "thai lan", "tom yum", "pad thai", "som tum", "mon thai",
    ],
    "Quán nướng / BBQ": [
        "nuong", "bbq", "barbecue", "xien nuong", "thit nuong",
        "lau nuong",
    ],
    "Quán lẩu": [
        "lau ", "hotpot", "hot pot", "nau lau", "an lau",
    ],
    "Quán bún / phở / mì": [
        "bun bo", "bun cha", "bun rieu", "pho bo", "pho ga", "quan pho", "hu tieu", "banh canh",
    ],
    "Quán cơm": [
        "com tam", "com trua", "com van phong", "com ga", "com suon",
        "com nieu", "com binh dan",
    ],
    "Quán ăn vặt": [
        "an vat", "snack", "xien que", "banh trang", "che",
    ],
    "Quán bánh": [
        "banh mi", "bakery", "tiem banh", "banh ngot", "banh kem",
        "croissant", "bread",
    ],
    "Quán kem": [
        "kem", "ice cream", "gelato",
    ],
    "Quán chay": [
        "chay", "vegetarian", "vegan",
    ],
    "Quán hải sản": [
        "hai san", "seafood",
    ],
    "Quán bia / pub": [
        "bia ", "beer", "pub", "craft beer", "bar ",
    ],
    "Quán pizza / fast food": [
        "pizza", "burger", "hamburger", "fast food", "ga ran", "fried chicken",
    ],
}

ITEM_RULES: Dict[str, List[str]] = {
    # Do uong
    "cà phê": ["ca phe", "cafe", "coffee", "espresso", "latte", "cappuccino", "americano"],
    "trà sữa": ["tra sua", "milk tea", "boba"],
    "nước ép": ["nuoc ep", "juice", "ep trai cay"],
    "sinh tố": ["sinh to", "smoothie"],
    "trà": ["tra dao", "tra chanh", "tra sen", "tra xanh", "tra o long", "tra hoa"],
    "đồ uống": ["do uong", "nuoc ngon", "nuoc uong", "thuc uong"],
    # Do an
    "sushi": ["sushi"],
    "sashimi": ["sashimi"],
    "ramen": ["ramen"],
    "phở": ["pho bo", "pho ga", "quan pho", "an pho"],
    "bún": ["bun bo", "bun cha", "bun rieu"],
    "cơm": ["com tam", "com trua", "com ga", "com suon", "com nieu"],
    "nướng": ["nuong", "bbq", "xien nuong"],
    "lẩu": ["lau ", "hotpot", "an lau"],
    "bánh mì": ["banh mi"],
    "bánh ngọt": ["banh ngot", "banh kem", "cake", "croissant"],
    "pizza": ["pizza"],
    "burger": ["burger", "hamburger"],
    "hải sản": ["hai san", "seafood"],
    "gà rán": ["ga ran", "fried chicken"],
    "set lunch": ["set lunch", "combo trua"],
    "kem": ["kem ", "ice cream", "gelato"],
    "chè": ["che "],
    "dimsum": ["dimsum", "dim sum", "ha cao", "siu mai"],
    "steak": ["steak", "bo bit tet", "bit tet"],
}

# Nhom mon: gom cac items lai thanh group
ITEM_GROUP_MAP: Dict[str, List[str]] = {
    "món Nhật": ["sushi", "sashimi", "ramen"],
    "món nướng": ["nướng"],
    "món lẩu": ["lẩu"],
    "món Việt": ["phở", "bún", "cơm", "bánh mì", "chè"],
    "đồ uống": ["cà phê", "trà sữa", "nước ép", "sinh tố", "trà", "đồ uống"],
    "bánh & kem": ["bánh ngọt", "kem"],
    "fast food": ["pizza", "burger", "gà rán"],
    "hải sản": ["hải sản"],
    "dimsum": ["dimsum"],
    "steak": ["steak"],
}

POSITIVE_ASPECT_RULES: Dict[str, List[str]] = {
    "đồ ăn ngon": [
        "do an ngon", "an ngon", "mon an ngon", "sieu ngon",
        "tuyet voi", "hai long", "chat luong",
    ],
    "đồ uống ngon": [
        "do uong ngon", "nuoc ngon", "uong ngon", "thuc uong ngon",
    ],
    "phục vụ tốt": [
        "phuc vu tot", "phuc vu nhiet", "phuc vu chu", "phuc vu nhanh",
        "phuc vu de", "service tot",
    ],
    "nhân viên thân thiện": [
        "nhan vien de", "vien de thuong", "nhan vien nhiet", "vien nhiet tinh",
        "nhan vien vui", "nhan vien than", "vien than thien",
        "than thien", "de thuong", "nhan vien nice", "nhan vien cuoi",
        "thien nhan vien", "take care",
    ],
    "không gian đẹp": [
        "gian dep", "gian rong", "trang tri dep", "view dep",
        "indochine", "phong cach", "decor dep", "thiet ke dep",
    ],
    "không gian yên tĩnh": [
        "gian yen tinh", "yen tinh", "chill", "thoai mai",
    ],
    "không gian rộng rãi": [
        "rong rai", "ngoi rong", "gian rong", "thoang",
    ],
    "giá hợp lý": [
        "gia hop ly", "gia ca phai chang", "gia re", "gia tot",
        "gia ok", "gia on", "binh dan",
    ],
    "sạch sẽ": [
        "sach se", "ve sinh", "sach lich su",
    ],
    "trải nghiệm tốt": [
        "trai nghiem tuyet", "trai nghiem tot", "trai nghiem nha",
        "dang thu", "dang de", "quay lai",
    ],
    "vị trí thuận tiện": [
        "de tim", "de den", "trung tam", "thuan tien",
        "duong lon", " gan ",
    ],
    "phù hợp học bài / làm việc": [
        "hoc bai", "lam viec", "wifi", "may lanh",
    ],
}

NEGATIVE_ASPECT_RULES: Dict[str, List[str]] = {
    "đợi món lâu": [
        "doi mon", "cho 30", "lam nuoc lau", "lam lau",
        "30p", "30 phut", "nua tieng",
        "cham", "cho mon",
    ],
    "giá cao": [
        "gia cao", "dat ", "gia cat", "mac ",
    ],
    "nhân viên chưa tốt": [
        "thai do", "thieu ton trong", "trich thuong",
        "nhan vien bao", "thai do bao",
    ],
    "chất lượng không ổn định": [
        "do te", "nuoc do", "binh thuong", "khong ngon",
        " chan",
    ],
    "vấn đề vệ sinh": [
        " do ", " ban ", "thieu ve sinh", "khai",
        "ruoi", "kien",
    ],
    "vấn đề đơn online / giao hàng": [
        "shipper", "giao hang", "don online", "grab",
        "order sai", "thieu nuoc",
    ],
    "ồn ào": [
        "on ao", "nhac to",
    ],
    "chỗ gửi xe khó": [
        "gui xe", "dau xe", "kho dau", "xe 10k",
    ],
}

PRICE_RULES: Dict[str, List[str]] = {
    "giá rẻ": [
        "gia re", "binh dan", "15k", "20k", "25k", "30k",
    ],
    "giá tầm trung": [
        "gia tam trung", "phai chang", "hop ly", "tam trung",
        "39k", "49k", "50k", "60k", "70k", "80k",
    ],
    "giá cao": [
        "gia cao", "dat ", "mac ", "200k", "300k", "4tr", "5tr",
        "trieu", "premium",
    ],
}

# Use case rules: derive tu categories + aspects
USE_CASE_MAP: Dict[str, Dict[str, List[str]]] = {
    "categories": {
        "ăn món Nhật": ["Nhà hàng Nhật"],
        "uống cà phê": ["Quán cà phê"],
        "uống trà sữa": ["Quán trà sữa"],
        "ăn nướng / BBQ": ["Quán nướng / BBQ"],
        "ăn lẩu": ["Quán lẩu"],
        "ăn hải sản": ["Quán hải sản"],
        "ăn chay": ["Quán chay"],
        "ăn bánh / kem": ["Quán bánh", "Quán kem"],
        "ăn fast food": ["Quán pizza / fast food"],
        "ăn món Hàn": ["Nhà hàng Hàn"],
        "ăn món Thái": ["Nhà hàng Thái"],
    },
    "aspects": {
        "đi ăn nhóm": ["không gian rộng rãi"],
        "hẹn hò": ["không gian đẹp", "không gian yên tĩnh"],
        "học bài / làm việc": ["phù hợp học bài / làm việc"],
        "ăn trưa văn phòng": ["giá hợp lý"],
    },
}


# ---------------------------------------------------------------------------
# Core extraction function
# ---------------------------------------------------------------------------

def _normalize(text: str) -> str:
    """Remove Vietnamese diacritics for matching."""
    nfkd = unicodedata.normalize('NFKD', text)
    return ''.join(c for c in nfkd if not unicodedata.combining(c)).lower()


def _collect_all_keywords(place: Dict[str, Any]) -> str:
    """Gom tat ca text lien quan cua place thanh 1 chuoi normalized de match."""
    parts: List[str] = []

    parts.append(place.get("place_name", ""))
    parts.append(place.get("address", ""))
    parts.append(place.get("summary_text", ""))

    for key in ("top_positive_keywords", "top_neutral_keywords", "top_negative_keywords"):
        keywords = place.get(key, [])
        if isinstance(keywords, list):
            parts.extend(keywords)

    return _normalize(" ".join(parts))


def _match_rules(text: str, rules: Dict[str, List[str]]) -> List[str]:
    """Tra ve list label co it nhat 1 pattern match trong text."""
    matched: List[str] = []
    for label, patterns in rules.items():
        for pattern in patterns:
            if pattern in text:
                matched.append(label)
                break
    return matched


def _match_items(text: str) -> List[str]:
    """Tra ve list items matched."""
    matched: List[str] = []
    for item, patterns in ITEM_RULES.items():
        for pattern in patterns:
            if pattern in text:
                matched.append(item)
                break
    return matched


def _derive_item_groups(items: List[str]) -> List[str]:
    """Tu list items, derive ra cac item groups."""
    groups: List[str] = []
    item_set: Set[str] = set(items)
    for group, group_items in ITEM_GROUP_MAP.items():
        if item_set & set(group_items):
            groups.append(group)
    return groups


def _derive_use_cases(
    categories: List[str],
    positive_aspects: List[str],
) -> List[str]:
    """Derive use cases tu categories va positive aspects."""
    use_cases: List[str] = []
    seen: Set[str] = set()

    # From categories
    cat_map = USE_CASE_MAP["categories"]
    for use_case, required_cats in cat_map.items():
        for rc in required_cats:
            if rc in categories and use_case not in seen:
                use_cases.append(use_case)
                seen.add(use_case)
                break

    # From positive aspects
    aspect_map = USE_CASE_MAP["aspects"]
    for use_case, required_aspects in aspect_map.items():
        for ra in required_aspects:
            if ra in positive_aspects and use_case not in seen:
                use_cases.append(use_case)
                seen.add(use_case)
                break

    return use_cases


def _extract_matched_keywords(
    place: Dict[str, Any],
) -> Dict[str, List[str]]:
    """Trich keywords da co san tu data."""
    return {
        "matched_positive_keywords": place.get("top_positive_keywords", []),
        "matched_neutral_keywords": place.get("top_neutral_keywords", []),
        "matched_negative_keywords": place.get("top_negative_keywords", []),
    }


def extract_place_signals(place: Dict[str, Any]) -> Dict[str, Any]:
    """
    Phan tich place data va tra ve signals dict.

    Input: dict chua thong tin 1 place tu review_summaries_with_text.json
    Output: dict chua cac derived signals
    """
    text = _collect_all_keywords(place)

    # 1. Categories
    derived_categories = _match_rules(text, PLACE_CATEGORY_RULES)

    # 2. Items
    derived_items = _match_items(text)

    # 3. Item groups
    derived_item_groups = _derive_item_groups(derived_items)

    # 4. Positive aspects
    derived_positive_aspects = _match_rules(text, POSITIVE_ASPECT_RULES)

    # 5. Negative aspects
    derived_negative_aspects = _match_rules(text, NEGATIVE_ASPECT_RULES)

    # 6. Price tags
    derived_price_tags = _match_rules(text, PRICE_RULES)

    # 7. Use cases
    derived_use_cases = _derive_use_cases(derived_categories, derived_positive_aspects)

    # 8. Matched keywords (passthrough from input)
    kw = _extract_matched_keywords(place)

    return {
        "derived_categories": derived_categories,
        "derived_item_groups": derived_item_groups,
        "derived_items": derived_items,
        "derived_positive_aspects": derived_positive_aspects,
        "derived_negative_aspects": derived_negative_aspects,
        "derived_price_tags": derived_price_tags,
        "derived_use_cases": derived_use_cases,
        "matched_positive_keywords": kw["matched_positive_keywords"],
        "matched_neutral_keywords": kw["matched_neutral_keywords"],
        "matched_negative_keywords": kw["matched_negative_keywords"],
    }
