// MapView.tsx
import { memo, useState } from "react";
import Map, {
	Marker,
	Popup,
	NavigationControl,
	GeolocateControl,
} from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useGeolocation } from "../../hooks/useGeolocation";
import { MapPin } from "lucide-react";

// Tọa độ mặc định (Khu vực Đại học Khoa học Tự nhiên - Nguyễn Văn Cừ)
const DEFAULT_VIEW_STATE = {
	longitude: 106.6823,
	latitude: 10.7626,
	zoom: 15,
	pitch: 45, // Góc nghiêng 3D
	bearing: 0,
};

interface LocationDetails {
	id: string;
	name: string;
	description: string;
	lat: number;
	lng: number;
}

/** Marker placed by SearchBar after selecting a final place */
export interface SearchMarker {
	lat: number;
	lng: number;
	name: string;
	address: string;
}

interface MapViewProps {
	/** Red marker placed by the search feature */
	searchMarker?: SearchMarker | null;
}

const MapView = memo(function MapView({ searchMarker }: MapViewProps) {
	const goongMapKey = import.meta.env.VITE_GOONG_MAP_KEY;
	const { location, loading } = useGeolocation();

	// Quản lý state cho Popup
	const [selectedLocation, setSelectedLocation] =
		useState<LocationDetails | null>(null);

	// Track which marker's popup the user has explicitly closed
	const [closedSearchMarker, setClosedSearchMarker] =
		useState<SearchMarker | null>(null);
	const showSearchPopup =
		searchMarker !== null && searchMarker !== closedSearchMarker;

	// URL Style Vector của Goong
	const mapStyle = `https://tiles.goong.io/assets/goong_map_web.json?api_key=${goongMapKey}`;

	if (loading) {
		return (
			<div className="flex bg-gray-100 items-center justify-center relative h-screen w-full rounded-xl overflow-hidden shadow-2xl">
				<span className="text-gray-500 font-medium">
					Đang tải bản đồ...
				</span>
			</div>
		);
	}

	const initialViewState = location
		? {
				...DEFAULT_VIEW_STATE,
				latitude: location.lat,
				longitude: location.lng,
			}
		: DEFAULT_VIEW_STATE;

	return (
		<div className="relative h-screen w-full rounded-xl overflow-hidden shadow-2xl">
			<Map
				id="mainMap"
				initialViewState={initialViewState}
				mapStyle={mapStyle}
				mapLib={maplibregl}
				interactiveLayerIds={["poi-label"]}
				style={{ width: "100%", height: "100%" }}
				onLoad={(e) => {
					const map = e.target;
					// Suppress missing image warnings from Goong's tile style by injecting a dummy transparent 1x1 pixel
					map.on("styleimagemissing", (ev: { id: string }) => {
						const id = ev.id;
						if (map.hasImage(id)) return;
						map.addImage(
							id,
							{ width: 1, height: 1, data: new Uint8Array(4) },
							{ pixelRatio: 1 },
						);
					});
				}}
			>
				{/* Control điều hướng cơ bản */}
				<NavigationControl position="bottom-left" />
				{/* Nút định vị người dùng hiện tại */}
				<GeolocateControl position="bottom-left" />

				{/* Marker vị trí hiện tại của bạn (xanh dương) */}
				{location && (
					<Marker
						longitude={location.lng}
						latitude={location.lat}
						anchor="bottom"
					>
						<div className="cursor-pointer transition-transform duration-300 hover:scale-125 hover:-translate-y-2">
							<div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white text-white">
								<MapPin size={20} />
							</div>
						</div>
					</Marker>
				)}

				{/* ── Red Marker — Vị trí tìm kiếm ──────────────────────── */}
				{searchMarker && (
					<Marker
						longitude={searchMarker.lng}
						latitude={searchMarker.lat}
						anchor="bottom"
					>
						<div
							className="cursor-pointer transition-transform duration-300 hover:scale-125 hover:-translate-y-2 animate-[searchMarkerDrop_0.5s_ease-out]"
							onClick={() => setClosedSearchMarker(null)}
						>
							<div className="w-9 h-9 bg-red-500 rounded-full flex items-center justify-center shadow-xl border-2 border-white text-white">
								<MapPin size={22} />
							</div>
							{/* Pulse ring effect */}
							<div className="absolute inset-0 w-9 h-9 rounded-full bg-red-400/30 animate-ping" />
						</div>
					</Marker>
				)}

				{/* Popup for search marker */}
				{searchMarker && showSearchPopup && (
					<Popup
						longitude={searchMarker.lng}
						latitude={searchMarker.lat}
						anchor="top"
						onClose={() =>
							setClosedSearchMarker(searchMarker || null)
						}
						closeOnClick={false}
						className="custom-popup"
						maxWidth="280px"
						offset={12}
					>
						<div className="glass-panel min-w-60">
							<h3 className="font-bold text-xl text-slate-800 mb-2 leading-tight">
								{searchMarker.name}
							</h3>
							<p className="text-sm text-slate-500 leading-relaxed font-medium">
								{searchMarker.address}
							</p>
						</div>
					</Popup>
				)}

				{/* Popup với hiệu ứng Glassmorphism */}
				{selectedLocation && (
					<Popup
						longitude={selectedLocation.lng}
						latitude={selectedLocation.lat}
						anchor="top"
						onClose={() => setSelectedLocation(null)}
						closeOnClick={false}
						className="custom-popup"
						maxWidth="300px"
					>
						<div className="p-4 bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl">
							<h3 className="font-bold text-lg text-gray-800 mb-1">
								{selectedLocation.name}
							</h3>
							<p className="text-sm text-gray-600 line-clamp-3">
								{selectedLocation.description}
							</p>
							<button className="mt-3 w-full py-2 bg-linear-to-r from-orange-400 to-red-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity text-sm">
								Xem chi tiết
							</button>
						</div>
					</Popup>
				)}
			</Map>
		</div>
	);
});

export default MapView;
