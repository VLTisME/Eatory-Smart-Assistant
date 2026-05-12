import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

export function useGeolocation() {
  const [searchParams] = useSearchParams();
  const [province, setProvince] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  useEffect(() => {
    // 1. Lấy dữ liệu từ URL
    const urlLat = searchParams.get("lat");
    const urlLng = searchParams.get("lng");
    const urlProvince = searchParams.get("province");

    // 2. Kiểm tra nếu có tọa độ từ trang Search truyền sang
    if (urlLat && urlLng) {
      setLocation({
        lat: parseFloat(urlLat),
        lng: parseFloat(urlLng),
      });
      if (urlProvince) setProvince(urlProvince);
      setLoading(false);
      // Khi đã có tọa độ từ URL thì dừng luôn, không chạy xuống logic GPS phía dưới
      return; 
    }

    // 3. Nếu KHÔNG có tọa độ từ URL, mới bắt đầu hỏi GPS
    if (!navigator.geolocation) {
      setError(true);
      setLoading(false);
      return;
    }

    setLoading(true); // Đảm bảo trạng thái loading khi bắt đầu lấy GPS
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          const addr = data.address;
          const p = addr.city || addr.state || addr.province || addr.town;

          if (p) {
            const clean = p
              .replace("Thành phố ", "")
              .replace("Tỉnh ", "")
              .trim();
            setProvince(clean);
          } else {
            setError(true);
          }
        } catch {
          setError(true);
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError(true);
        setLoading(false)// Kết thúc dù thành công hay lỗi
      }
    );
  }, [searchParams]); 

  return { province, location, error, loading }; // Trả thêm biến loading
}