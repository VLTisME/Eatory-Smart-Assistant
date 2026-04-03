import { useState, useEffect } from "react";
import axios from "axios";// Lấy vị trí người dùng
import ScrollSelect from "../components/ScrollSelect";

// Dữ liệu mẫu (DATABASE)
const DATABASE: Record<string, string[]> = {
  "Hà Nội": ["Phở Hà Nội", "Bún Chả", "Bún Thang", "Cốm Vòng"],
  "Đà Nẵng": ["Mì Quảng", "Bánh Tráng Cuốn Thịt Heo", "Bê Thui Cầu Mống"],
  "TP Hồ Chí Minh": ["Cơm Tấm", "Hủ Tiếu Nam Vang", "Bánh Mì Sài Gòn"],
};

export default function Home() {
  const [tempProvince, setTempProvince] = useState("Đang xác định...");
  const [searchProvince, setSearchProvince] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(true);

  // Hàm thực hiện tìm kiếm dùng chung
  const performSearch = (provinceName: string) => {
    setSearchProvince(provinceName);
    
    // Lấy dữ liệu trong DATABASE thì lấy, không có thì tạo dữ liệu ảo
    const filteredData = DATABASE[provinceName] || [
      `Món ăn ngon tại ${provinceName} 1`,
      `Món ăn ngon tại ${provinceName} 2`,
      `Món ăn ngon tại ${provinceName} 3`,
      `Món ăn ngon tại ${provinceName} 4`,
    ];
    
    setResults(filteredData);
    setShowResults(true);
  };

  // useEffect tự động lấy vị trí
  useEffect(() => {
    const getLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            try {
              const response = await axios.get(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
              );
              const addr = response.data.address;
              const province = addr.city || addr.state || addr.province || addr.town;

              if (province) {
                const clean = province
                  .replace("Thành phố ", "")
                  .replace("Tỉnh ", "")
                  .trim();

                setTempProvince(clean);
                performSearch(clean);
              }
            } catch (error) {
              console.error("Lỗi lấy địa chỉ:", error);
              setTempProvince("Dĩ An");
              performSearch("Dĩ An");
            }
          },
          () => {
            setTempProvince("Dĩ An");
            performSearch("Dĩ An");
          }
        );
      }
    };
    getLocation();
  }, []);

  // Hàm xử lý khi người dùng nhấn nút Search
  const handleSearchClick = () => {
    performSearch(tempProvince);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden">
      {/* NỬA BÊN TRÁI */}
      <div
        className="w-full md:w-1/2 h-full bg-cover bg-center relative flex items-center justify-center"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e')",
        }}
      >
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="relative z-10 flex flex-col items-center w-full px-10">
          <h1 className="text-white text-4xl lg:text-6xl font-bold mb-12 drop-shadow-2xl text-center">
            Khám phá ẩm thực Việt
          </h1>

          <div className="flex items-center gap-2 bg-white/10 p-2 rounded-lg backdrop-blur-sm w-full max-w-md">
            <ScrollSelect 
              value={tempProvince} 
              onSelect={setTempProvince} 
            />
            <button
              onClick={handleSearchClick}
              className="bg-yellow-600 hover:bg-yellow-700 px-8 py-4 rounded text-white font-bold transition-all active:scale-95 whitespace-nowrap"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* NỬA BÊN PHẢI */}
      <div className="w-full md:w-1/2 h-full bg-gray-50 overflow-y-auto p-10 pt-24 transition-all duration-500">
        {showResults ? (
          <>
            <h2 className="sticky top-0 z-20 bg-gray-50 px-4 py-6 -mt-10 mb-6 text-2xl font-bold text-gray-800 border-b shadow-[0_-50px_0_0_#f9fafb]">
              Ẩm thực tại {searchProvince}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
              {results.map((item, index) => (
                <div
                  key={index}
                  className="group relative overflow-hidden rounded-xl shadow-lg aspect-video bg-gray-200"
                >
                  <img
                    src={`https://picsum.photos/seed/${item}/600/400`}
                    alt={item}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute bottom-0 left-0 p-3 text-white font-bold bg-linear-to-t from-black/70 to-transparent w-full">
                    {item}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 italic">
            Vui lòng chọn tỉnh thành
          </div>
        )}
      </div>
    </div>
  );
}