import { useState } from "react";
import ToggleButton from "../sidebar/ToggleButton";
import FloatingSidebar from "../sidebar/FloatingSideBar";
import GoogleMapView from "../map/GoogleMapView";

function MapLayout() {
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);

	return (
		<div className="relative w-screen h-screen overflow-hidden bg-slate-800">
			<div className="absolute inset-0 z-0">
				<GoogleMapView />
			</div>
			<div className="absolute top-0 right-0 z-50 h-full p-4 pointer-events-none">
				<div className="h-full pointer-events-auto flex items-start justify-end">
					{isSidebarOpen ? (
						<FloatingSidebar
							onClose={() => setIsSidebarOpen(false)}
						/>
					) : (
						<ToggleButton
							handleClick={() => setIsSidebarOpen(true)}
						/>
					)}
				</div>
			</div>
		</div>
	);
}

export default MapLayout;
