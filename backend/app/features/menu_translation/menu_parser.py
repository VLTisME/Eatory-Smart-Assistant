"""Rule-based menu parser - xử lý OCR text thành structured data."""
import re
import uuid
from dataclasses import dataclass, field


@dataclass
class ParsedItem:
    name: str
    price: int | None = None
    price_text: str | None = None  # "Thời giá", "Liên hệ"
    is_addon: bool = False
    confidence: float = 1.0  # Độ tin cậy của parse


@dataclass 
class ParsedCategory:
    title: str
    items: list[ParsedItem] = field(default_factory=list)


@dataclass
class ParseResult:
    categories: list[ParsedCategory] = field(default_factory=list)
    unparsed_lines: list[str] = field(default_factory=list)  # Dòng không parse được
    confidence: float = 1.0  # Tổng thể confidence
    

class MenuParser:
    """
    Parse OCR raw text thành structured menu data.
    
    Cách hoạt động:
    1. Tách text thành từng dòng
    2. Nhận diện dòng nào là CATEGORY (tiêu đề danh mục)
    3. Nhận diện dòng nào là ITEM (tên + giá)
    4. Nhận diện dòng nào là ADDON (topping, thêm)
    5. Gom nhóm lại
    """
    
    # --- REGEX PATTERNS ---
    
    # Pattern nhận diện giá tiền VN: 50.000, 50,000, 50000, 50k, 50K
    PRICE_PATTERNS = [
        r'(\d{1,3}(?:[.,]\d{3})+)\s*(?:đ|VND|vnđ|d)?',  # 50.000đ, 50,000
        r'(\d{2,6})\s*(?:đ|VND|vnđ|d)',                   # 50000đ
        r'(\d{2,3})\s*[kK]',                               # 50k, 50K
        r'(\d{4,6})',                                       # 50000 (standalone number)
    ]
    
    # Pattern nhận diện "market price" / giá liên hệ
    MARKET_PRICE_KEYWORDS = [
        'thời giá', 'giá thị trường', 'liên hệ', 'market price',
        'theo mùa', 'call for price', 'giá tùy', 'tùy size',
    ]
    
    # Pattern nhận diện CATEGORY headers
    CATEGORY_INDICATORS = [
        r'^[A-ZÀ-Ỹ\s&]+$',                    # Dòng UPPERCASE toàn bộ
        r'^(?:MENU|MÓN|ĐỒ|THỨC UỐNG|NƯỚC)',    # Từ khóa header phổ biến
        r'[-=]{3,}',                             # Dấu gạch ngang/bằng phân cách
        r'^[IVXLC]+\.',                          # Số La Mã: I. II. III.
        r'^\d+\.\s*[A-ZÀ-Ỹ]',                  # 1. CATEGORY NAME
    ]
    
    # Pattern nhận diện ADDON / TOPPING
    ADDON_KEYWORDS = [
        'thêm', 'extra', 'add', 'topping', 'kèm', 'phụ',
        'side', 'addon', 'thêm vào',
    ]
    
    def parse(self, raw_text: str) -> ParseResult:
        """Main parse method."""
        lines = self._preprocess(raw_text)
        result = ParseResult()
        
        current_category = ParsedCategory(title="Menu")  # Default category
        
        for line in lines:
            # Bỏ dòng rỗng
            if not line.strip():
                continue
            
            # Thử nhận diện category
            if self._is_category_header(line):
                if current_category.items:  # Save previous category
                    result.categories.append(current_category)
                current_category = ParsedCategory(title=self._clean_category_title(line))
                continue
            
            # Thử parse item (tên + giá)
            parsed = self._parse_item_line(line)
            if parsed:
                current_category.items.append(parsed)
            else:
                result.unparsed_lines.append(line)
        
        # Append last category
        if current_category.items:
            result.categories.append(current_category)
        
        # Tính confidence tổng thể
        total = len(lines)
        parsed_count = sum(len(c.items) for c in result.categories)
        result.confidence = parsed_count / max(total, 1)
        
        return result
    
    def _preprocess(self, text: str) -> list[str]:
        """Clean up OCR noise."""
        # Loại bỏ ký tự rác từ OCR
        text = re.sub(r'[|\\{}[\]<>]', '', text)
        # Merge các dòng bị break sai (OCR hay tách 1 dòng thành 2)
        lines = text.strip().split('\n')
        return [line.strip() for line in lines if line.strip()]
    
    def _is_category_header(self, line: str) -> bool:
        """Check xem dòng có phải là tiêu đề category không."""
        # Dòng quá dài thường không phải header
        if len(line) > 50:
            return False
        # Dòng có giá → không phải header
        if self._extract_price(line) is not None:
            return False
        for pattern in self.CATEGORY_INDICATORS:
            if re.search(pattern, line, re.IGNORECASE):
                return True
        return False
    
    def _parse_item_line(self, line: str) -> ParsedItem | None:
        """Parse 1 dòng thành MenuItem."""
        # Check market price trước
        for keyword in self.MARKET_PRICE_KEYWORDS:
            if keyword in line.lower():
                name = re.sub(rf'\s*{re.escape(keyword)}.*', '', line, flags=re.IGNORECASE).strip()
                if name:
                    return ParsedItem(
                        name=name,
                        price_text=keyword.title(),
                    )
        
        # Parse giá
        price = self._extract_price(line)
        if price is not None:
            # Tách tên khỏi giá
            name = self._extract_name(line)
            if name and len(name) > 1:
                is_addon = any(kw in line.lower() for kw in self.ADDON_KEYWORDS)
                return ParsedItem(name=name, price=price, is_addon=is_addon)
        
        # Dòng có text nhưng không có giá → có thể là description, bỏ qua
        return None
    
    def _extract_price(self, line: str) -> int | None:
        """Trích xuất giá từ dòng text."""
        for pattern in self.PRICE_PATTERNS:
            match = re.search(pattern, line)
            if match:
                raw = match.group(1)
                # Chuẩn hóa: bỏ dấu chấm/phẩy -> int
                cleaned = raw.replace('.', '').replace(',', '')
                try:
                    price = int(cleaned)
                    # Nếu giá < 1000 → khả năng là đơn vị 'k' → nhân 1000
                    if price < 1000 and 'k' in line.lower():
                        price *= 1000
                    elif price < 1000:
                        price *= 1000  # Heuristic: menu VN hiếm khi < 1000đ
                    return price
                except ValueError:
                    continue
        return None
    
    def _extract_name(self, line: str) -> str:
        """Tách tên món khỏi phần giá."""
        # Đường chấm dẫn: "Phở tái nạm ........ 50.000"
        name = re.split(r'\.{3,}|_{3,}|-{3,}', line)[0].strip()
        # Bỏ phần số/giá cuối dòng
        name = re.sub(r'\s*\d[\d.,kK]*\s*(?:đ|VND|vnđ|d)?\s*$', '', name).strip()
        # Bỏ số thứ tự đầu: "1. Phở" → "Phở"  
        name = re.sub(r'^\d+[.)]\s*', '', name).strip()
        return name
    
    def _clean_category_title(self, line: str) -> str:
        """Clean up category title."""
        title = re.sub(r'[-=]{3,}', '', line).strip()
        title = re.sub(r'^\d+[.)]\s*', '', title).strip()
        return title or "Khác"

