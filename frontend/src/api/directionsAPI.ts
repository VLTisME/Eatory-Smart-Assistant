/**
 * Directions API — calls backend endpoint that proxies Goong Directions.
 *
 * Endpoint: GET /api/v1/directions?origin=lat,lng&destination=lat,lng&vehicle=car
 */

const BASE_URL = "http://localhost:8000/api/v1";

/* ─── Types ────────────────────────────────────────────────────────────────── */

export interface DistanceInfo {
	text: string;
	value: number;
}

export interface DurationInfo {
	text: string;
	value: number;
}

export interface LocationInfo {
	lat: number;
	lng: number;
}

export interface StepInfo {
	distance: DistanceInfo;
	duration: DurationInfo;
	html_instructions: string;
	travel_mode: string;
}

export interface LegInfo {
	distance: DistanceInfo;
	duration: DurationInfo;
	start_address: string;
	end_address: string;
	start_location: LocationInfo;
	end_location: LocationInfo;
	steps: StepInfo[];
}

export interface OverviewPolyline {
	points: string;
}

export interface RouteInfo {
	legs: LegInfo[];
	overview_polyline: OverviewPolyline;
	warnings: string[];
	waypoint_order: unknown[];
}

export interface DirectionResponse {
	routes: RouteInfo[];
	geocoded_waypoints: unknown[];
}

export type TransportMode = "car" | "motorcycle" | "taxi";

/* ─── API Call ─────────────────────────────────────────────────────────────── */

/** Fetch directions between two coordinates via our backend proxy. */
export async function fetchDirections(
	originLat: number,
	originLng: number,
	destLat: number,
	destLng: number,
	vehicle: TransportMode = "car",
	signal?: AbortSignal,
): Promise<DirectionResponse> {
	const params = new URLSearchParams({
		origin: `${originLat},${originLng}`,
		destination: `${destLat},${destLng}`,
		vehicle,
	});

	const res = await fetch(`${BASE_URL}/directions?${params}`, { signal });
	if (!res.ok) {
		const body = await res.json().catch(() => ({}));
		throw new Error(
			(body as { detail?: string }).detail ??
				`Directions failed (${res.status})`,
		);
	}
	return res.json();
}
