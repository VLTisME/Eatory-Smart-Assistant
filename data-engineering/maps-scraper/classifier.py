KEYWORD_MAP: dict[str, list[str]] = {
    "food": [
        "quán",
        "nhà hàng",
        "phở",
        "bún",
        "cơm",
        "cafe",
        "cà phê",
        "trà sữa",
        "ăn vặt",
        "lẩu",
        "nướng",
        "bánh",
    ],
    "attraction": [
        "chùa",
        "đền",
        "nhà thờ",
        "bảo tàng",
        "di tích",
        "công viên",
        "thảo cầm viên",
        "dinh",
        "chợ",
        "khu du lịch",
    ],
    "entertainment": [
        "karaoke",
        "bar",
        "club",
        "pub",
        "rạp chiếu phim",
        "cgv",
        "lotte cinema",
        "khu vui chơi",
        "bowling",
        "bida",
        "massage",
    ],
}


def classify_place_type(text: str) -> str | None:
    if not text:
        return None

    lowered = text.lower()

    for place_type, keywords in KEYWORD_MAP.items():
        for keyword in keywords:
            if keyword in lowered:
                return place_type

    return None
