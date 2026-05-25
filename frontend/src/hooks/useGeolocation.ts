import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { VietNam_Provinces } from "../data/travelData";

/**
 * Strip common Vietnamese administrative prefixes and normalize for matching.
 */
function cleanProvinceName(raw: string): string {
	return raw
		.replace(/^Thành phố\s+/i, "")
		.replace(/^Tỉnh\s+/i, "")
		.trim();
}

/**
 * Try to match a raw address field against VietNam_Provinces.
 * Returns the matched province name from the canonical list, or null.
 */
function matchProvince(raw: string): string | null {
	const cleaned = cleanProvinceName(raw);
	return VietNam_Provinces.find((p) => p === cleaned) ?? null;
}

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
						`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
					);
					const data = await res.json();
					const addr = data.address;

					// Try all address fields and match against VietNam_Provinces.
					// Nominatim may return a city-level subdivision (e.g. "Dĩ An") in addr.city
					// instead of the province name (e.g. "Bình Dương") which is in addr.state.
					// We check each field against VietNam_Provinces and use the first match.
					const candidates = [
						addr.state,
						addr.province,
						addr.city,
						addr.town,
						addr.county,
					].filter(Boolean);

					let matched: string | null = null;
					for (const candidate of candidates) {
						matched = matchProvince(candidate);
						if (matched) break;
					}

					if (matched) {
						setProvince(matched);
					} else {
						// Fallback: use the first available field with prefix stripping
						const fallback =
							addr.city ||
							addr.state ||
							addr.province ||
							addr.town;
						if (fallback) {
							setProvince(cleanProvinceName(fallback));
						} else {
							setError(true);
						}
					}
				} catch {
					setError(true);
				} finally {
					setLoading(false);
				}
			},
			() => {
				setError(true);
				setLoading(false); // Kết thúc dù thành công hay lỗi
			},
		);
	}, [searchParams]);

	return { province, location, error, loading }; // Trả thêm biến loading
}
