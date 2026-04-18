import { useState, useEffect } from "react";
import HeroSection from "./Search/HeroSection";
import FoodGrid from "./Search/foodGrid";
import { useGeolocation } from "../../hooks/useGeolocation";
import { useFoodSearch } from "../../hooks/useFoodSearch";

export default function Header() {
  const { province: detectedProvince, error, loading: geoLoading } = useGeolocation();
  const [selectedProvince, setSelectedProvince] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const { results, search, loading: searchLoading } = useFoodSearch(); 

  const displayProvince = selectedProvince || detectedProvince;

  // 1. Tự động tìm kiếm khi phát hiện vị trí 
useEffect(() => {
    if (detectedProvince && results.length === 0 && !searchLoading) {
      search(detectedProvince);
    }
  }, [detectedProvince, search, results.length, searchLoading]);

  // 2. Hàm xử lý khi user nhấn nút Search 
  const handleSearch = () => {
    if (!displayProvince) return;

    search(displayProvince);
    setHasSearched(true);

    // Cuộn xuống phần kết quả
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

      {/* TRẠNG THÁI 1: Đang lấy vị trí từ GPS/API */}
      {(geoLoading||searchLoading) && (
        <div className="flex flex-col items-center justify-center p-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Đang xác định vị trí của bạn...</p>
        </div>
      )}

      {/* TRẠNG THÁI 2: Hiển thị kết quả (Chỉ hiện khi đã lấy xong vị trí và có kết quả) */}
{!geoLoading && !searchLoading && hasSearched && ( // Thêm && ở đây
  <div className="max-w-6xl mx-auto p-10">
    {results.length > 0 ? (
      <>
        <div className="flex items-center justify-between mb-6 border-b pb-4">
          <h2 className="text-3xl font-bold text-gray-800">
            Recommended for you
          </h2>
        </div>
        <FoodGrid items={results} />
      </>
    ) : (
      <p className="text-center text-gray-500">Result not found.</p>
    )}
  </div>
)}
    </>
  );
}