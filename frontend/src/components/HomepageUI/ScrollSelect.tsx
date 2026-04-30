//ScrollSelect.tsx
import { useState, useEffect, useRef } from "react";
import { VietNam_Provinces } from "../../data/travelData";

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
    localStorage.setItem("province", option);
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
          {VietNam_Provinces.map((province) => (
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
