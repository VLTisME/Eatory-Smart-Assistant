import { useState } from "react";
import type { FoodType } from "../data/foodData";
import { DATABASE } from "../data/foodData";

// xóa dấu tiếng Việt
const normalizeVietnamese = (str: string) => {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
};

// 👉 tạo data giả
const generateFakeData = (province: string): FoodType[] => {
  return Array.from({ length: 6 }).map((_, i) => ({
    title: `Món ngon ${i + 1} tại ${province}`,
    location: province,
    rating: Math.round((4 + Math.random()) * 10) / 10,
    image: `https://picsum.photos/seed/${province}-${i}/600/400`,
  }));
};

 export function useFoodSearch() {
  const [results, setResults] = useState<FoodType[]>([]);
  const [loading, setLoading] = useState(false); // Khai báo loading

  const search = (province: string) => {
    if (!province) {
      setResults([]);
      return;
    }

    setLoading(true); // 1. Bật loading khi bắt đầu search

    // Giả lập trễ 800ms để user thấy được vòng xoay (UX tốt hơn)
    setTimeout(() => {
      const cleaned = province
        .replace("Thành phố ", "")
        .replace("Tỉnh ", "")
        .trim();

      const normalizedInput = normalizeVietnamese(cleaned);

      const foundKey = Object.keys(DATABASE).find(
        (key) => normalizeVietnamese(key) === normalizedInput
      );

      let data: FoodType[];

      if (foundKey) {
        data = DATABASE[foundKey];
      } else {
        data = generateFakeData(cleaned);
      }

      setResults(data);
      setLoading(false); // 2. Tắt loading sau khi đã có dữ liệu
    }, 800); 
  };

  // 3. QUAN TRỌNG: Phải trả về loading ở đây
  return { results, search, loading };
}