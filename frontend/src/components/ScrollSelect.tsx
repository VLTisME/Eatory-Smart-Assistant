import { useState, useEffect, useRef } from "react";

const VIETNAM_PROVINCES = [
  "An Giang","Bà Rịa - Vũng Tàu","Bắc Giang","Bắc Kạn","Bạc Liêu","Bắc Ninh","Bến Tre",
  "Bình Định","Bình Dương","Bình Phước","Bình Thuận","Cà Mau","Cần Thơ","Cao Bằng","Đà Nẵng",
  "Đắk Lắk","Đắk Nông","Điện Biên","Đồng Nai","Đồng Tháp","Gia Lai","Hà Giang","Hà Nam",
  "Hà Nội","Hà Tĩnh","Hải Dương","Hải Phòng","Hậu Giang","Hòa Bình","Hưng Yên","Khánh Hòa",
  "Kiên Giang","Kon Tum","Lai Châu","Lâm Đồng","Lạng Sơn","Lào Cai","Long An","Nam Định",
  "Nghệ An","Ninh Bình","Ninh Thuận","Phú Thọ","Phú Yên","Quảng Bình","Quảng Nam","Quảng Ngãi",
  "Quảng Ninh","Quảng Trị","Sóc Trăng","Sơn La","Tây Ninh","Thái Bình","Thái Nguyên","Thanh Hóa",
  "Thừa Thiên Huế","Tiền Giang","TP Hồ Chí Minh","Trà Vinh","Tuyên Quang","Vĩnh Long","Vĩnh Phúc","Yên Bái",
];

interface ScrollSelectProps {
  value?: string;
  onSelect?: (value: string) => void;
}

export default function ScrollSelect({ value, onSelect }: ScrollSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null); 

  // Logic xử lý Click Outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        open &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const handleSelect = (option: string) => {
    if (onSelect) onSelect(option);
    setOpen(false);
  };

  return (
    <div className="relative w-full max-w-125" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full p-4 bg-white border rounded-2xl shadow text-left text-black flex justify-between items-center focus:outline-none"
      >
        <span className="truncate">{value || "Chọn tỉnh/thành phố"}</span>
        <span
          className={`transform transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`}
        >
          ▼
        </span>
      </button>

      {open && (
        <div className="absolute top-full mt-1 w-full bg-white border rounded-2xl shadow-xl max-h-60 overflow-y-auto z-100 text-black overflow-hidden">
          {VIETNAM_PROVINCES.map((province) => (
            <div
              key={province}
              onClick={() => handleSelect(province)}
              className={`p-3 hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition-colors border-b last:border-0 ${
                value === province ? "bg-blue-100 font-bold text-blue-700" : ""
              }`}
            >
              {province}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
