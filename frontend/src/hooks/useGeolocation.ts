import { useEffect, useState } from "react";
export function useGeolocation() {
	const [province, setProvince] = useState("");
	const [error, setError] = useState(false);
	const [loading, setLoading] = useState(true); // Mặc định là true khi bắt đầu
	const [location, setLocation] = useState<{
		lat: number;
		lng: number;
	} | null>(null);

	useEffect(() => {
		if (!navigator.geolocation) {
			setError(true);
			setLoading(false);
			return;
		}

		navigator.geolocation.getCurrentPosition(
			async (position) => {
				const { latitude, longitude } = position.coords;
				setLocation({ lat: latitude, lng: longitude });
				try {
					const res = await fetch(
						`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
					);
					const data = await res.json();
					const addr = data.address;
					const p =
						addr.city || addr.state || addr.province || addr.town;

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
					setLoading(false); // Kết thúc dù thành công hay lỗi
				}
			},
			() => {
				setError(true);
				setLoading(false);
			},
		);
	}, []);

	return { province, location, error, loading }; // Trả thêm biến loading
}
