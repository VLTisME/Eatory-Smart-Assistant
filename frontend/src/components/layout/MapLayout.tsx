import { useState, useCallback, useEffect } from "react";
import ToggleButton from "../sidebar/ToggleButton";
import FloatingSidebar from "../sidebar/FloatingSideBar";
import GoogleMapView, { type SearchMarker } from "../map/GoogleMapView";
import SearchBar from "../sidebar/SearchBar";
import { MapProvider, useMap } from "react-map-gl/maplibre";
import { type PlaceDetailResult } from "../../api/placeSearchAPI";
import { type Message } from "../sidebar/ChatBotPanel";
import ChatBotFullSize from "../sidebar/ChatBotFullSize";
import PlaceSidebar from "../sidebar/PlaceSidebar";
import type { RouteInfo } from "../../api/directionsAPI";

/**
 * SearchBarWithMap — wrapper that uses the useMap hook to flyTo
 * when a final place is selected, and lifts the marker state up.
 */
function SearchBarWithMap({
	onPlaceSelected,
}: {
	onPlaceSelected: (marker: SearchMarker) => void;
}) {
	const { mainMap } = useMap();

	const handleSelectPlace = useCallback(
		(place: PlaceDetailResult) => {
			if (!place.geometry?.location) return;

			const { lat, lng } = place.geometry.location;

			onPlaceSelected({
				lat,
				lng,
				name: place.name,
				address: place.formatted_address,
			});

			mainMap?.flyTo({
				center: [lng, lat],
				zoom: 16,
				padding: { left: 400 },
				duration: 2000,
				essential: true,
			});
		},
		[mainMap, onPlaceSelected],
	);

	return <SearchBar onSelectPlace={handleSelectPlace} />;
}

function MapLayout() {
	const [sidebarMode, setSidebarMode] = useState<
		"button" | "sidebar" | "fullsize"
	>("button");
	const [messages, setMessages] = useState<Message[]>([]);
	const [isThinking, setIsThinking] = useState<boolean>(false);
	const [activeChat, setActiveChat] = useState<string | null>(null);

	const [searchMarker, setSearchMarker] = useState<SearchMarker | null>(null);

	const [activeRoute, setActiveRoute] = useState<RouteInfo | null>(null);

	const handleRouteResult = useCallback((route: RouteInfo | null) => {
		setActiveRoute(route);
	}, []);

	useEffect(() => {
		const handleOpenChatbot = (event: Event) => {
			const e = event as CustomEvent;
			if (sidebarMode !== "sidebar") {
				setSidebarMode("sidebar");
			}
			setTimeout(() => {
				window.dispatchEvent(
					new CustomEvent("process-chatbot-action", {
						detail: e.detail,
					}),
				);
			}, 100);
		};
		window.addEventListener("open-chatbot", handleOpenChatbot);
		return () =>
			window.removeEventListener("open-chatbot", handleOpenChatbot);
	}, [sidebarMode]);

	return (
		<MapProvider>
			<div className="relative w-screen h-screen overflow-hidden bg-slate-800">
				<div className="absolute inset-0 z-50 pointer-events-none">
					<SearchBarWithMap onPlaceSelected={setSearchMarker} />
				</div>
				<div className="absolute inset-0 z-0">
					<GoogleMapView
						searchMarker={searchMarker}
						activeRoute={activeRoute}
					/>
				</div>
				<div className="absolute top-0 left-0 z-40 h-full pointer-events-none">
					<PlaceSidebar
						place={searchMarker}
						onRouteResult={handleRouteResult}
					/>
				</div>
				<div className="absolute top-0 right-0 z-50 h-full w-full pointer-events-none">
					<div className="h-full flex items-start justify-end p-4">
						{sidebarMode === "sidebar" ? (
							<div className="h-full w-104 pointer-events-auto">
								<FloatingSidebar
									onClose={() => setSidebarMode("button")}
									onFullScreen={() =>
										setSidebarMode("fullsize")
									}
									messages={messages}
									setMessages={setMessages}
									isThinking={isThinking}
									setIsThinking={setIsThinking}
									activeChat={activeChat}
									setActiveChat={setActiveChat}
								/>
							</div>
						) : sidebarMode === "button" ? (
							<div className="pointer-events-auto">
								<ToggleButton
									handleClick={() =>
										setSidebarMode("sidebar")
									}
								/>
							</div>
						) : null}
					</div>
					{sidebarMode === "fullsize" && (
						<div className="absolute bottom-0 left-0 w-full h-[85vh] px-12 transition-transform duration-500 ease-in-out z-50 translate-y-0 pointer-events-auto">
							<ChatBotFullSize
								onClose={() => setSidebarMode("sidebar")}
								messages={messages}
								setMessages={setMessages}
								isThinking={isThinking}
								setIsThinking={setIsThinking}
								activeChat={activeChat}
								setActiveChat={setActiveChat}
							/>
						</div>
					)}
				</div>
			</div>
		</MapProvider>
	);
}

export default MapLayout;
