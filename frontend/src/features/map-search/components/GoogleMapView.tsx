// MapView.tsx
import { memo, useState, useEffect, useMemo } from "react";
import Map, {
	Marker,
	Popup,
	NavigationControl,
	GeolocateControl,
	Source,
	Layer,
} from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useGeolocation } from "../../../hooks/useGeolocation";
import { MapPin } from "lucide-react";
import { useMap } from "react-map-gl/maplibre";
import type { RouteInfo } from "../../directions/services/directionsAPI";

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

export interface SearchMarker {
	lat: number;
	lng: number;
	name: string;
	address: string;
}

interface MapViewProps {
	searchMarker?: SearchMarker | null;
	activeRoute?: RouteInfo | null;
}

/**
 * Decode a Google-encoded polyline string into an array of [lng, lat] pairs.
 * Based on the algorithm described at:
 * https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */
function decodePolyline(encoded: string): [number, number][] {
	const coords: [number, number][] = [];
	let index = 0;
	let lat = 0;
	let lng = 0;

	while (index < encoded.length) {
		let b: number;
		let shift = 0;
		let result = 0;
		do {
			b = encoded.charCodeAt(index++) - 63;
			result |= (b & 0x1f) << shift;
			shift += 5;
		} while (b >= 0x20);
		const dlat = result & 1 ? ~(result >> 1) : result >> 1;
		lat += dlat;
		shift = 0;
		result = 0;
		do {
			b = encoded.charCodeAt(index++) - 63;
			result |= (b & 0x1f) << shift;
			shift += 5;
		} while (b >= 0x20);
		const dlng = result & 1 ? ~(result >> 1) : result >> 1;
		lng += dlng;

		coords.push([lng / 1e5, lat / 1e5]); // GeoJSON uses [lng, lat]
	}

	return coords;
}

const MapView = memo(function MapView({
	searchMarker,
	activeRoute,
}: MapViewProps) {
	const goongMapKey = import.meta.env.VITE_GOONG_MAP_KEY;
	const { location, loading } = useGeolocation();
	const { mainMap } = useMap();

	const [selectedLocation, setSelectedLocation] =
		useState<LocationDetails | null>(null);

	const [closedSearchMarker, setClosedSearchMarker] =
		useState<SearchMarker | null>(null);
	const showSearchPopup =
		searchMarker !== null && searchMarker !== closedSearchMarker;

	const routeGeoJSON =
		useMemo<GeoJSON.Feature<GeoJSON.LineString> | null>(() => {
			return activeRoute?.overview_polyline?.points
				? {
						type: "Feature",
						properties: {},
						geometry: {
							type: "LineString",
							coordinates: decodePolyline(
								activeRoute.overview_polyline.points,
							),
						},
					}
				: null;
		}, [activeRoute]);

	useEffect(() => {
		if (!routeGeoJSON || !mainMap) return;

		const coords = routeGeoJSON.geometry.coordinates;
		if (coords.length < 2) return;

		const bounds = new maplibregl.LngLatBounds(
			[coords[0][0], coords[0][1]],
			[coords[0][0], coords[0][1]],
		);

		for (const coord of coords) {
			bounds.extend([coord[0], coord[1]]);
		}

		mainMap.fitBounds(bounds, {
			padding: { top: 80, bottom: 80, left: 440, right: 80 },
			duration: 1000,
			maxZoom: 16,
		});
	}, [routeGeoJSON, mainMap]);

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
				<NavigationControl position="bottom-left" />
				<GeolocateControl position="bottom-left" />
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
				{routeGeoJSON && (
					<>
						<Source
							id="route-source"
							type="geojson"
							data={routeGeoJSON}
						>
							<Layer
								id="route-outline"
								type="line"
								paint={{
									"line-color": "#1e40af",
									"line-width": 8,
									"line-opacity": 0.25,
								}}
								layout={{
									"line-cap": "round",
									"line-join": "round",
								}}
							/>
							<Layer
								id="route-line"
								type="line"
								paint={{
									"line-color": "#3b82f6",
									"line-width": 5,
									"line-opacity": 0.9,
								}}
								layout={{
									"line-cap": "round",
									"line-join": "round",
								}}
							/>
						</Source>
					</>
				)}
			</Map>
		</div>
	);
});

export default MapView;
