
import { useState, useEffect } from "react";
import HeroSection from "./Search/HeroSection";
import FoodGrid from "./Search/foodGrid";
import { useGeolocation } from "../../hooks/useGeolocation";
import { useFoodSearch } from "../../hooks/useFoodSearch";

interface HeaderProps {
  selectedProvince: string;
  setSelectedProvince: (value: string) => void;
}

export default function Header({
  selectedProvince,
  setSelectedProvince,
}: HeaderProps) {
  const {
    province: detectedProvince,
    error,
    loading: geoLoading,
  } = useGeolocation();

  const displayProvince = selectedProvince || detectedProvince;

  const [hasSearched, setHasSearched] = useState(() => {
    return localStorage.getItem("hasSearched") === "true";
  });

  const { results, search, loading: searchLoading } = useFoodSearch();

  //  key riêng theo tỉnh
  const storageKey = displayProvince
    ? `foods_${displayProvince}`
    : "foods_default";

  //  lấy data từ localStorage
  const storedFoods = localStorage.getItem(storageKey);

 const displayFoods =
  hasSearched
    ? results.length > 0
      ? results
      : storedFoods
      ? JSON.parse(storedFoods)
      : []
    : [];
  //  lưu data khi có kết quả mới 
  useEffect(() => {
    if (results.length > 0 && displayProvince) {
      localStorage.setItem(storageKey, JSON.stringify(results));
    }
  }, [results, displayProvince, storageKey]);


  //  click search
  const handleSearch = () => {
    if (!displayProvince) return;

    search(displayProvince);
    setHasSearched(true);

    localStorage.setItem("hasSearched", "true");

    setTimeout(() => {
      window.scrollTo({
        top: window.innerHeight * 0.8,
        behavior: "smooth",
      });
    }, 100);
  };

  return (
    <>
      <HeroSection
        province={displayProvince}
        setProvince={setSelectedProvince}
        hasError={error}
        isLoading={geoLoading || searchLoading}
        onSearch={handleSearch}
      />

      {/* Loading */}
      {(geoLoading || searchLoading) && (
        <div className="flex flex-col items-center justify-center p-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">
            Đang xác định vị trí của bạn...
          </p>
        </div>
      )}

      {/* Result */}
      {!geoLoading && !searchLoading  && hasSearched && displayFoods.length > 0 && (
        <div className="max-w-6xl mx-auto p-10">
          <div className="flex items-center justify-between mb-6 border-b pb-4">
            <h2 className="text-3xl font-bold text-gray-800">
              Recommended for you
            </h2>
          </div>

          <FoodGrid items={displayFoods} />
        </div>
      )}
    </>
  );
}