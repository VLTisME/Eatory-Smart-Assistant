import { useState } from "react";
import ToggleButton from "../sidebar/ToggleButton";
import FloatingSidebar from "../sidebar/FloatingSideBar";
import GoogleMapView from "../map/GoogleMapView";
import SearchBar from "../sidebar/SearchBar";
import { type Message } from "../sidebar/ChatBotPanel";
import ChatBotFullSize from "../sidebar/ChatBotFullSize";

function MapLayout() {
    const [sidebarMode, setSidebarMode] = useState<
        "button" | "sidebar" | "fullsize"
    >("button");
    const [messages, setMessages] = useState<Message[]>([]);
    const [isThinking, setIsThinking] = useState<boolean>(false);

    return (
        <div className="relative w-screen h-screen overflow-hidden bg-slate-800">
            <div className="absolute inset-0 z-50 pointer-events-none">
                <SearchBar />
            </div>
            <div className="absolute inset-0 z-0">
                <GoogleMapView />
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
    );
}

export default MapLayout;
