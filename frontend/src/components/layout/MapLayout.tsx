import { useState } from "react";
import ToggleButton from "../sidebar/ToggleButton";
import FloatingSidebar from "../sidebar/FloatingSideBar";
import GoogleMapView from "../map/GoogleMapView";
import { type Message } from "../sidebar/ChatBotPanel";

function MapLayout() {
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const [messages, setMessages] = useState<Message[]>([]);
	const [isThinking, setIsThinking] = useState<boolean>(false);

	return (
		<div className="relative w-screen h-screen overflow-hidden bg-slate-800">
			<div className="absolute inset-0 z-0">
				<GoogleMapView />
			</div>
			<div className="absolute top-0 right-0 z-50 h-full w-full p-4 pointer-events-none">
				<div className="h-full flex items-start justify-end">
					{isSidebarOpen ? (
						<div className="h-full pointer-events-auto">
							<FloatingSidebar
								onClose={() => setIsSidebarOpen(false)}
								messages={messages}
								setMessages={setMessages}
								isThinking={isThinking}
								setIsThinking={setIsThinking}
							/>
						</div>
					) : (
						<div className="pointer-events-auto">
							<ToggleButton
								handleClick={() => setIsSidebarOpen(true)}
							/>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export default MapLayout;
