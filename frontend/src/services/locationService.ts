import axios from "axios";

export async function getProvinceFromCoords(lat: number, lon: number) {
	const res = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
		params: { format: "json", lat, lon, zoom: 10 },
	});

	const addr = res.data.address;

	return addr.city || addr.state || addr.province || addr.town;
}
