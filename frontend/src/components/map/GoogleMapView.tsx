// GoogleMapView.tsx
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { memo } from "react";
import L from "leaflet";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
delete (L.Icon.Default.prototype as unknown as Record<string, string>)
	._getIconUrl;
L.Icon.Default.mergeOptions({
	iconUrl: markerIcon,
	iconRetinaUrl: markerIcon2x,
	shadowUrl: markerShadow,
});

const GoogleMapView = memo(function GoogleMapView() {
	const position: [number, number] = [10.7626, 106.6823];
	return (
		<MapContainer
			center={position}
			zoom={15}
			scrollWheelZoom={true}
			style={{ height: "100vh", width: "100vw" }}
		>
			<TileLayer
				attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
				url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
			/>
			<Marker position={position}>
				<Popup>Giao diện bản đồ test thử 🚀</Popup>
			</Marker>
		</MapContainer>
	);
});

export default GoogleMapView;
