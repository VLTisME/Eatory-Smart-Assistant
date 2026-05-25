import { useState, useCallback, useEffect } from "react";
import ToggleButton from "../../features/map-search/components/ToggleButton";
import FloatingSidebar from "../../features/chatbot/components/FloatingSideBar";
import GoogleMapView, { type SearchMarker } from "../../features/map-search/components/GoogleMapView";
import SearchBar from "../../features/map-search/components/SearchBar";
import { MapProvider, useMap } from "react-map-gl/maplibre";
import { type PlaceDetailResult, getPlaceDetail } from "../../features/map-search/services/placeSearchAPI";
import { type Message } from "../../features/chatbot/components/ChatBotPanel";
import ChatBotFullSize from "../../features/chatbot/components/ChatBotFullSize";
import PlaceSidebar from "../../features/map-search/components/PlaceSidebar";
import type { RouteInfo } from "../../features/directions/services/directionsAPI";
import type { PlaceSearchItem } from "../../types/placeSearch";

/**
 * SearchBarWithMap — wrapper that uses the useMap hook to flyTo
 * when a final place is selected, and lifts the marker state up.
 */
function SearchBarWithMap({
	searchQuery,
	onSearchQueryChange,
	onPlaceSelected,
}: {
	searchQuery: string;
	onSearchQueryChange: (val: string) => void;
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

	return (
		<SearchBar
			query={searchQuery}
			onQueryChange={onSearchQueryChange}
			onSelectPlace={handleSelectPlace}
		/>
	);
}

function MapLayoutContent() {
	const { mainMap } = useMap();
	const [sidebarMode, setSidebarMode] = useState<
		"button" | "sidebar" | "fullsize"
	>("button");
	const [messages, setMessages] = useState<Message[]>([]);
	const [isThinking, setIsThinking] = useState<boolean>(false);
	const [activeChat, setActiveChat] = useState<string | null>(null);

	const [searchMarker, setSearchMarker] = useState<SearchMarker | null>(null);
	const [searchQuery, setSearchQuery] = useState("");

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

	const handlePlaceClick = useCallback(
		async (item: PlaceSearchItem) => {
			setSearchQuery(item.name);

			try {
				const response = await getPlaceDetail(item.place_id);
				if (response.result) {
					const placeDetail = response.result;
					if (placeDetail.geometry?.location) {
						const { lat, lng } = placeDetail.geometry.location;

						setSearchMarker({
							lat,
							lng,
							name: placeDetail.name,
							address: placeDetail.formatted_address,
						});

						mainMap?.flyTo({
							center: [lng, lat],
							zoom: 16,
							padding: { left: 400 },
							duration: 2000,
							essential: true,
						});
					} else {
						setSearchMarker(null);
					}
				} else {
					setSearchMarker(null);
				}
			} catch (error) {
				console.error("Failed to fetch place detail on click:", error);
				setSearchMarker(null);
			}
		},
		[mainMap],
	);

	return (
		<div className="relative w-screen h-screen overflow-hidden bg-slate-800">
			<div className="absolute inset-0 z-50 pointer-events-none">
				<SearchBarWithMap
					searchQuery={searchQuery}
					onSearchQueryChange={setSearchQuery}
					onPlaceSelected={setSearchMarker}
				/>
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
								onPlaceClick={handlePlaceClick}
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
							onPlaceClick={handlePlaceClick}
						/>
					</div>
				)}
			</div>
		</div>
	);
}

function MapLayout() {
	return (
		<MapProvider>
			<MapLayoutContent />
		</MapProvider>
	);
}

export default MapLayout;
