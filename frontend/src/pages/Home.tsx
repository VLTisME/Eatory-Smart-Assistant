import { useState, useEffect } from "react";
import axios from "axios";
import ScrollSelect from "../components/ScrollSelect";

// Dữ liệu mẫu (DATABASE) - Bạn có thể tùy chỉnh hoặc fetch từ API
const DATABASE: Record<string, string[]> = {
  "Hà Nội": ["Phở Hà Nội", "Bún Chả", "Bún Thang", "Cốm Vòng","Phở Hà Nội", "Bún Chả", 
    "Bún Thang", "Cốm Vòng","Phở Hà Nội", "Bún Chả", "Bún Thang", "Cốm Vòng"],
  "Đà Nẵng": ["Mì Quảng", "Bánh Tráng Cuốn Thịt Heo", "Bê Thui Cầu Mống"],
  "TP Hồ Chí Minh": ["Cơm Tấm", "Hủ Tiếu Nam Vang", "Bánh Mì Sài Gòn"],
};

export default function Home() {
  const [tempProvince, setTempProvince] = useState("Đang xác định...");
  const [results, setResults] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(true);

  // 1. Hàm thực hiện tìm kiếm dùng chung (logic xử lý dữ liệu)
  const performSearch = (provinceName: string) => {

    // Nếu có trong DATABASE thì lấy, không thì tạo dữ liệu ảo
    const filteredData = DATABASE[provinceName] || [
      `Món ăn ngon tại ${provinceName} 1`,
      `Món ăn ngon tại ${provinceName} 2`,
      `Món ăn ngon tại ${provinceName} 3`,
      `Món ăn ngon tại ${provinceName} 4`,
    ];
    
    setResults(filteredData);
    setShowResults(true);
  };

  // 2. useEffect tự động lấy vị trí và hiện kết quả ngay lập tức
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
            } catch {
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

  // 3. Hàm xử lý khi người dùng nhấn nút Search thủ công
  const handleSearchClick = () => {
    performSearch(tempProvince);

    setTimeout(() => {
    window.scrollTo({
      top: window.innerHeight * 0.8, // Cuộn xuống khoảng 80% màn hình
      behavior: 'smooth'
    });
  }, 100);
  };

  return (
    <div className="flex flex-col min-h-screen w-full ">
      {/* NỬA BÊN TRÁI */}
      <div
        className="w-full h-[85vh] bg-cover bg-center relative flex items-center justify-center"
        style={{
          backgroundImage: "url('https://images.baodantoc.vn/uploads/2023/Th%C3%A1ng%202/Ng%C3%A0y_13/Nga/007-rs-8636.jpg')",
        }}
      >
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="relative z-10 flex flex-col items-center w-full px-10">
          <h1 className="text-white text-3xl lg:text-5xl font-bold mb-24 drop-shadow-2xl text-center">
           Du ngoạn khắp nơi, ẩm thực tuyệt vời
          </h1>
          <div className="flex items-center gap-2 bg-white/10 p-1 rounded-2xl backdrop-blur-sm w-full max-w-md">
            <ScrollSelect 
              value={tempProvince} 
              onSelect={setTempProvince} 
            />
            <button
              onClick={handleSearchClick}
              className="bg-[#6453df] hover:bg-[#3836bc] px-8 py-4 rounded-2xl text-white font-bold transition-all active:scale-95 whitespace-nowrap"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* NỬA DƯỚI */}
<div className="w-full bg-gray-50 pt-6 md:px-10 py-12 transition-all duration-500">
        {showResults && (
          <div className="max-w-7xl mx-auto">
            <h2 className=" bg-gray-50 py-6 mb-8 text-3xl font-bold text-gray-800 border-b">
              TOP FOODS
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
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
          </div>
        )}
      </div>
    </div>
  );
}