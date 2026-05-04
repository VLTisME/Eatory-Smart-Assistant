import { useEffect, useState } from "react";

export function useGeolocation() {
  const [province, setProvince] = useState("");
  const [error, setError] = useState(false);

  const [loading, setLoading] = useState(true);

  // Thêm tọa độ GPS
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError(true);
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Lưu GPS user
        setLat(latitude);
        setLng(longitude);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );

          const data = await res.json();

          const addr = data.address;

          const p =
            addr.city ||
            addr.state ||
            addr.province ||
            addr.town;

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
        setLoading(false);
      }
    );
  }, []);

  return {
    province,
    error,
    loading,

    // Trả thêm GPS
    lat,
    lng,
  };
}