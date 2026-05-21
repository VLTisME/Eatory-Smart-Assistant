import { useState, useCallback, useRef } from "react";
import {
	fetchDirections,
	type DirectionResponse,
	type TransportMode,
} from "../services/directionsAPI";
import { useLanguage } from "../../../hooks/useLanguage";

interface UseDirectionsOptions {
	originLat?: number | null;
	originLng?: number | null;
	destLat?: number | null;
	destLng?: number | null;
}

export function useDirections(opts: UseDirectionsOptions = {}) {
	const { lang } = useLanguage();
	const [result, setResult] = useState<DirectionResponse | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [vehicle, setVehicle] = useState<TransportMode>("car");

	const abortRef = useRef<AbortController | null>(null);
	const lastRequestRef = useRef<string>("");

	const fetchRoute = useCallback(
		async (mode?: TransportMode) => {
			const { originLat, originLng, destLat, destLng } = opts;
			if (
				originLat == null ||
				originLng == null ||
				destLat == null ||
				destLng == null
			) {
				setError(
					lang === "vi"
						? "Thiếu tọa độ điểm đi hoặc điểm đến"
						: "Origin or destination coordinates are missing",
				);
				return;
			}

			const vehicleToUse = mode ?? vehicle;

			// Prevent duplicate requests
			const requestKey = `${originLat},${originLng}-${destLat},${destLng}-${vehicleToUse}`;
			if (requestKey === lastRequestRef.current && result) return;

			// Abort previous request
			abortRef.current?.abort();
			const controller = new AbortController();
			abortRef.current = controller;
			lastRequestRef.current = requestKey;

			setIsLoading(true);
			setError(null);

			try {
				const data = await fetchDirections(
					originLat,
					originLng,
					destLat,
					destLng,
					vehicleToUse,
					controller.signal,
				);

				if (!controller.signal.aborted) {
					setResult(data);
					if (data.routes.length === 0) {
						setError(
							lang === "vi"
								? "Không tìm thấy tuyến đường"
								: "No route found",
						);
					}
				}
			} catch (err: unknown) {
				if ((err as Error)?.name === "AbortError") return;
				console.error("Directions error:", err);
				if (!controller.signal.aborted) {
					setError(
						(err as Error)?.message ??
							(lang === "vi"
								? "Lỗi lấy chỉ đường. Vui lòng thử lại."
								: "Failed to get directions. Please try again."),
					);
				}
			} finally {
				if (!controller.signal.aborted) {
					setIsLoading(false);
				}
			}
		},
		[lang, opts, vehicle, result],
	);

	const changeVehicle = useCallback(
		(mode: TransportMode) => {
			setVehicle(mode);
			// Reset last request so re-fetch works
			lastRequestRef.current = "";
			fetchRoute(mode);
		},
		[fetchRoute],
	);

	const clear = useCallback(() => {
		setResult(null);
		setError(null);
		setIsLoading(false);
		lastRequestRef.current = "";
		abortRef.current?.abort();
	}, []);

	return {
		result,
		isLoading,
		error,
		vehicle,
		setVehicle: changeVehicle,
		fetchRoute,
		clear,
	};
}
