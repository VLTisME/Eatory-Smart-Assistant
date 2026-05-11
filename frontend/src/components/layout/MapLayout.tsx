import { useState, useCallback } from "react";
import ToggleButton from "../sidebar/ToggleButton";
import FloatingSidebar from "../sidebar/FloatingSideBar";
import GoogleMapView, { type SearchMarker } from "../map/GoogleMapView";
import SearchBar from "../sidebar/SearchBar";
import { MapProvider, useMap } from "react-map-gl/maplibre";
import { type PlaceDetailResult } from "../../api/placeSearchAPI";
import { type Message } from "../sidebar/ChatBotPanel";
import ChatBotFullSize from "../sidebar/ChatBotFullSize";
import PlaceSidebar from "../sidebar/PlaceSidebar";

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

            // Update the red marker
            onPlaceSelected({
                lat,
                lng,
                name: place.name,
                address: place.formatted_address,
            });

            // Fly the map to the selected location, padding for the sidebar width (400px)
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

    // Red marker state — set when the user selects a final place from search
    const [searchMarker, setSearchMarker] = useState<SearchMarker | null>(null);

    return (
        <MapProvider>
            <div className="relative w-screen h-screen overflow-hidden bg-slate-800">
                <div className="absolute inset-0 z-50 pointer-events-none">
                    <SearchBarWithMap onPlaceSelected={setSearchMarker} />
                </div>
                <div className="absolute inset-0 z-0">
                    <GoogleMapView searchMarker={searchMarker} />
                </div>
                <div className="absolute top-0 left-0 z-40 h-full pointer-events-none">
                    <PlaceSidebar place={searchMarker} />
                </div>
                <div className="absolute top-0 right-0 z-50 h-full w-full pointer-events-none">
                    <div className="h-full flex items-start justify-end p-4">
                        {sidebarMode === "sidebar" ? (
                            <div className="h-full w-104 pointer-events-auto">
                                <FloatingSidebar
                                    onClose={() => setSidebarMode("button")}
                                    onFullScreen={() => setSidebarMode("fullsize")}
                                    messages={messages}
                                    setMessages={setMessages}
                                    isThinking={isThinking}
                                    setIsThinking={setIsThinking}
                                />
                            </div>
                        ) : sidebarMode === "button" ? (
                            <div className="pointer-events-auto">
                                <ToggleButton
                                    handleClick={() => setSidebarMode("sidebar")}
                                />
                            </div>
                        ) : null}
                    </div>

                    {/* Fullsize ChatBot container with slide up animation */}
                    {sidebarMode === "fullsize" && (
                        <div className="absolute bottom-0 left-0 w-full h-[85vh] px-12 transition-transform duration-500 ease-in-out z-50 translate-y-0 pointer-events-auto">
                            <ChatBotFullSize
                                onClose={() => setSidebarMode("sidebar")}
                                messages={messages}
                                setMessages={setMessages}
                                isThinking={isThinking}
                                setIsThinking={setIsThinking}
                            />
                        </div>
                    )}
                </div>
            </div>
        </MapProvider>
    );
}

export default MapLayout;
