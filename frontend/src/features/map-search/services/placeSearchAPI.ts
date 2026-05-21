import { apiV1 } from "../../../config/api";

export interface StructuredFormatting {
	main_text: string;
	secondary_text: string;
}

export interface PlacePrediction {
	description: string;
	place_id: string;
	structured_formatting: StructuredFormatting | null;
	has_children: boolean;
	score: number | null;
}

export interface AutocompleteResponse {
	predictions: PlacePrediction[];
	status: string;
}

export interface PlaceGeometry {
	location: { lat: number; lng: number };
}

export interface PlaceDetailResult {
	place_id: string;
	formatted_address: string;
	name: string;
	geometry: PlaceGeometry | null;
}

export interface PlaceDetailResponse {
	result: PlaceDetailResult | null;
	status: string;
}

/**
 * Fetch autocomplete predictions.
 * @param signal – AbortSignal so the caller can cancel stale requests.
 */
export const searchPlaces = async (
	input: string,
	options?: {
		location?: string;
		limit?: number;
		radius?: number;
		signal?: AbortSignal;
	},
): Promise<AutocompleteResponse> => {
	const params = new URLSearchParams({ input });

	if (options?.location) params.set("location", options.location);
	if (options?.limit) params.set("limit", String(options.limit));
	if (options?.radius) params.set("radius", String(options.radius));

	const res = await fetch(apiV1(`/places/autocomplete?${params.toString()}`), {
		signal: options?.signal,
	});

	if (!res.ok) {
		const body = await res.json().catch(() => ({}));
		throw new Error(body.detail ?? `Search failed (${res.status})`);
	}

	return res.json();
};

export const getPlaceDetail = async (
	placeId: string,
	signal?: AbortSignal,
): Promise<PlaceDetailResponse> => {
	const params = new URLSearchParams({ place_id: placeId });

	const res = await fetch(apiV1(`/places/detail?${params.toString()}`), {
		signal,
	});

	if (!res.ok) {
		const body = await res.json().catch(() => ({}));
		throw new Error(body.detail ?? `Detail failed (${res.status})`);
	}

	return res.json();
};
