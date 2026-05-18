import { useState, useEffect, useCallback } from "react";
import { X, Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DirectionLocationSelect from "./DirectionLocationSelect";
import DirectionTransportModes from "./DirectionTransportModes";
import DirectionResult from "./DirectionResult";
import {
	fetchDirections,
	type DirectionResponse,
	type TransportMode,
	type RouteInfo,
} from "../../api/directionsAPI";

interface DirectionPanelProps {
	userLat: number | null;
	userLng: number | null;
	destLat: number;
	destLng: number;
	destName: string;
	onClose: () => void;
	onRouteResult: (route: RouteInfo | null) => void;
}

export default function DirectionPanel({
	userLat,
	userLng,
	destLat,
	destLng,
	destName,
	onClose,
	onRouteResult,
}: DirectionPanelProps) {
	const [vehicle, setVehicle] = useState<TransportMode>("car");
	const [result, setResult] = useState<DirectionResponse | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [originLabel, setOriginLabel] = useState("");
	const [geoLoading, setGeoLoading] = useState(false);

	const [lastRequest, setLastRequest] = useState("");

	useEffect(() => {
		if (userLat != null && userLng != null) {
			setOriginLabel(`${userLat.toFixed(5)}, ${userLng.toFixed(5)}`);
			setGeoLoading(true);
			fetch(
				`https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLat}&lon=${userLng}`,
			)
				.then((r) => r.json())
				.then((data: { display_name?: string }) => {
					if (data.display_name) {
						const parts = data.display_name.split(",").slice(0, 3);
						setOriginLabel(parts.join(",").trim());
					}
				})
				.catch(() => {
					// Keep coordinate label
				})
				.finally(() => setGeoLoading(false));
		}
	}, [userLat, userLng]);

	const doFetch = useCallback(
		async (mode: TransportMode) => {
			if (userLat == null || userLng == null) {
				setError("Không thể xác định vị trí của bạn");
				return;
			}

			const requestKey = `${userLat},${userLng}-${destLat},${destLng}-${mode}`;
			if (requestKey === lastRequest && result) return;

			setIsLoading(true);
			setError(null);
			setLastRequest(requestKey);

			try {
				const data = await fetchDirections(
					userLat,
					userLng,
					destLat,
					destLng,
					mode,
				);
				setResult(data);
				if (data.routes.length > 0) {
					onRouteResult(data.routes[0]);
				} else {
					setError("Không tìm thấy tuyến đường");
					onRouteResult(null);
				}
			} catch (err: unknown) {
				console.error("Direction fetch error:", err);
				setError(
					(err as Error)?.message ??
						"Lỗi lấy chỉ đường. Vui lòng thử lại.",
				);
				onRouteResult(null);
			} finally {
				setIsLoading(false);
			}
		},
		[
			userLat,
			userLng,
			destLat,
			destLng,
			lastRequest,
			result,
			onRouteResult,
		],
	);

	useEffect(() => {
		if (userLat != null && userLng != null) {
			doFetch(vehicle);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [userLat, userLng]);

	const handleModeChange = (mode: TransportMode) => {
		setVehicle(mode);
		setLastRequest("");
		doFetch(mode);
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: -20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -20 }}
			transition={{ type: "spring", damping: 25, stiffness: 300 }}
			className="bg-white rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden"
		>
			<div className="flex items-center justify-between px-5 py-3.5 bg-linear-to-r from-blue-600 to-blue-700">
				<h3 className="text-white font-bold text-[15px] tracking-tight">
					Chỉ đường
				</h3>
				<button
					type="button"
					onClick={onClose}
					className="cursor-pointer text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1.5 transition-all"
				>
					<X size={18} />
				</button>
			</div>
			<div className="p-4 space-y-4">
				<DirectionLocationSelect
					originLabel={originLabel}
					destinationLabel={destName}
					originLoading={geoLoading}
				/>
				<DirectionTransportModes
					selected={vehicle}
					onChange={handleModeChange}
					disabled={isLoading}
				/>

				<AnimatePresence mode="wait">
					{isLoading && (
						<motion.div
							key="loading"
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: "auto" }}
							exit={{ opacity: 0, height: 0 }}
							className="flex items-center justify-center py-6"
						>
							<Loader2
								size={28}
								className="text-blue-500 animate-spin"
							/>
							<span className="ml-3 text-sm text-slate-500 font-medium">
								Đang tính toán tuyến đường...
							</span>
						</motion.div>
					)}

					{!isLoading && error && (
						<motion.div
							key="error"
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: "auto" }}
							exit={{ opacity: 0, height: 0 }}
							className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl"
						>
							<AlertCircle
								size={20}
								className="text-red-500 shrink-0"
							/>
							<p className="text-sm text-red-700 font-medium">
								{error}
							</p>
						</motion.div>
					)}

					{!isLoading &&
						!error &&
						result &&
						result.routes.length > 0 && (
							<motion.div
								key="result"
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: "auto" }}
								exit={{ opacity: 0, height: 0 }}
							>
								<DirectionResult route={result.routes[0]} />
							</motion.div>
						)}
					{!isLoading &&
						!error &&
						userLat == null &&
						userLng == null && (
							<motion.div
								key="empty"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								className="text-center py-4"
							>
								<p className="text-sm text-slate-500 font-medium">
									Vui lòng cho phép truy cập vị trí để tính
									đường đi
								</p>
							</motion.div>
						)}
				</AnimatePresence>
			</div>
		</motion.div>
	);
}
