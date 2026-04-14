// MapView.tsx
import { memo, useState, useCallback } from "react";
import Map, {
    Marker,
    Popup,
    NavigationControl,
    GeolocateControl,
} from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// Tọa độ mặc định (Khu vực Đại học Khoa học Tự nhiên - Nguyễn Văn Cừ)
const INITIAL_VIEW_STATE = {
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

const mockFoodLocation: LocationDetails = {
    id: "food-1",
    name: "Cơm tấm bãi rác",
    description: "Quán ăn bình dân nổi bật theo đánh giá phân tích cảm xúc.",
    lat: 10.7626,
    lng: 106.6823,
};

const MapView = memo(function MapView() {
    const goongMapKey = import.meta.env.VITE_GOONG_MAP_KEY;

    // Quản lý state cho Popup
    const [selectedLocation, setSelectedLocation] =
        useState<LocationDetails | null>(null);

    // Tối ưu hàm callback tránh re-render
    const handleMarkerClick = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (e: any, location: LocationDetails) => {
            e.originalEvent.stopPropagation();
            setSelectedLocation(location);
        },
        [],
    );

    // URL Style Vector của Goong
    const mapStyle = `https://tiles.goong.io/assets/goong_map_web.json?api_key=${goongMapKey}`;

    return (
        <div className="relative h-screen w-full rounded-xl overflow-hidden shadow-2xl">
            <Map
                initialViewState={INITIAL_VIEW_STATE}
                mapStyle={mapStyle}
                mapLib={maplibregl}
                interactiveLayerIds={["poi-label"]}
                style={{ width: "100%", height: "100%" }}
            >
                {/* Control điều hướng cơ bản */}
                <NavigationControl position="top-left" />
                {/* Nút định vị người dùng hiện tại */}
                <GeolocateControl position="top-left" />

                {/* Marker Custom với hiệu ứng hover */}
                <Marker
                    longitude={mockFoodLocation.lng}
                    latitude={mockFoodLocation.lat}
                    anchor="bottom"
                    onClick={(e) => handleMarkerClick(e, mockFoodLocation)}
                >
                    <div className="cursor-pointer transition-transform duration-300 hover:scale-125 hover:-translate-y-2">
                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-bounce">
                            🍽️
                        </div>
                    </div>
                </Marker>

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
