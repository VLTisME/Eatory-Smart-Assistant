import { useState } from "react";
import type { FoodType } from "../data/foodData";
import placesData from "../../../data/places.json";
import { UBND_COORDS } from "../data/ubndCoords";

interface RawPlaceData {
  place_id: string;
  name: string | null;
  city: string;
  district: string;
  avg_rating: number;
  total_reviews: number;
  address: string;
  lat: number;
  lng: number;
}

const normalizeVietnamese = (str: string) => {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
};

export function useFoodSearch() {
  const [results, setResults] = useState<FoodType[]>([]);
  const [loading, setLoading] = useState(false);

  const search = (province: string) => {

    setResults([]);

    if (!province) {
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const searchCity = province
        .replace("Thành phố ", "")
        .replace("TP ", "")
        .replace("Tỉnh ", "")
        .trim();

      const normalizedInput = normalizeVietnamese(searchCity);

      const filtered = (placesData as RawPlaceData[])
        .filter((item) => {
          const normalizedItemCity = normalizeVietnamese(item.city);

          return (
            normalizedItemCity.includes(normalizedInput) ||
            normalizedInput.includes(normalizedItemCity)
          );
        })
        .sort((a, b) => b.avg_rating - a.avg_rating)
        .slice(0, 6);

      // Nếu không có dữ liệu -> tạo mock data
      if (filtered.length === 0) {
        const mockNames = [
          `Quán ngon ở ${searchCity}`,
          `Đặc sản ${searchCity}`,
          `Ẩm thực ${searchCity}`,
          `Food Tour ${searchCity}`,
          `Món ngon ${searchCity}`,
          `Best Food ${searchCity}`,
        ];

        const mockData: FoodType[] = mockNames.map((name, index) => ({
          place_id: `mock-${normalizedInput}-${index}`,
          name,
          city: searchCity,
          address: `Địa chỉ quán tại ${searchCity}`,
          avg_rating: Math.round((4 + Math.random()) * 10) / 10,
          total_reviews: Math.floor(Math.random() * 500),
          image: `https://picsum.photos/600/400?random=${normalizedInput}${index}`,

          lat: UBND_COORDS[searchCity]?.lat || 0,
          lng: UBND_COORDS[searchCity]?.lng || 0,
         
          isMock: true,
        }));

        setResults(mockData);
        setLoading(false);
        return;
      }

      // Data thật
      const finalData: FoodType[] = filtered.map((place, index) => {
        const displayRating =
          place.avg_rating > 0
            ? place.avg_rating
            : Math.round((4 + Math.random()) * 10) / 10;

        const randomImage = `https://picsum.photos/600/400?random=${place.place_id.slice(
          -5
        )}${index}`;

        return {
          place_id: place.place_id,
          name: place.name || `Địa điểm tại ${place.city}`,
          city: place.city,
          address:
  place.address && place.district
    ? `${place.address}, ${place.district}`
    : place.address || `Địa chỉ quán ở ${place.city}`,
          avg_rating: displayRating,
          total_reviews: place.total_reviews || 0,
          image: randomImage,

          lat: place.lat,
          lng: place.lng,

          isMock: false,
        };
      });

      setResults(finalData);
      setLoading(false);
    }, 800);
  };

  return { results, search, loading };
}