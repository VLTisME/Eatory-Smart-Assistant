import { apiV1 } from "../../../config/api";
import type { AppLanguage } from "../../../hooks/useLanguage";

/* ─── Types ────────────────────────────────────────────────────────────────── */

export interface LocationSchema {
	lat: number;
	lng: number;
}

export interface PlaceDetailItem {
	place_id: string;
	name: string;
	type: string;
	address: string;
	location: LocationSchema;
	avg_rating: number;
	total_review: number;
	review?: string;
}

export interface PlaceDetailResponse {
	data: PlaceDetailItem;
}

export interface PlacesByCityResponse {
	data: PlaceDetailItem[];
	total: number;
}

export interface PlaceExistsResponse {
	exists: boolean;
	data: PlaceDetailItem | null;
}

export interface SingleImageResponse {
	image_id: string;
	place_id: string;
	file_path: string;
}

/* ─── Place Details API ────────────────────────────────────────────────────── */
export async function fetchPlaceDetail(
	placeId: string,
	signal?: AbortSignal,
): Promise<PlaceDetailResponse> {
	const params = new URLSearchParams({ place_id: placeId });
	const res = await fetch(apiV1(`/place-details?${params}`), { signal });
	if (!res.ok) {
		const body = await res.json().catch(() => ({}));
		throw new Error(body.detail ?? `Place detail failed (${res.status})`);
	}
	return res.json();
}

export async function fetchPlacesByCity(
	city: string,
	limit = 4,
	signal?: AbortSignal,
): Promise<PlacesByCityResponse> {
	const params = new URLSearchParams({
		city,
		limit: String(limit),
	});
	const res = await fetch(apiV1(`/place-details/by-city?${params}`), {
		signal,
	});
	if (!res.ok) {
		const body = await res.json().catch(() => ({}));
		throw new Error(body.detail ?? `Places by city failed (${res.status})`);
	}
	return res.json();
}

export async function checkPlaceExists(
	name: string,
	signal?: AbortSignal,
): Promise<PlaceExistsResponse> {
	const params = new URLSearchParams({ name });
	const res = await fetch(apiV1(`/place-details/check-place?${params}`), {
		signal,
	});
	if (!res.ok) {
		const body = await res.json().catch(() => ({}));
		throw new Error(body.detail ?? `Check place failed (${res.status})`);
	}
	return res.json();
}

/* ─── Place Images API ─────────────────────────────────────────────────────── */
export async function fetchRandomImage(
	placeId: string,
	signal?: AbortSignal,
): Promise<SingleImageResponse> {
	const params = new URLSearchParams({ place_id: placeId });
	const res = await fetch(apiV1(`/place-images/random?${params}`), {
		signal,
	});
	if (!res.ok) {
		const body = await res.json().catch(() => ({}));
		throw new Error(body.detail ?? `Random image failed (${res.status})`);
	}
	return res.json();
}

export async function fetchSingleImage(
	placeId: string,
	signal?: AbortSignal,
): Promise<SingleImageResponse> {
	const params = new URLSearchParams({ place_id: placeId });
	const res = await fetch(apiV1(`/place-images/single?${params}`), {
		signal,
	});
	if (!res.ok) {
		const body = await res.json().catch(() => ({}));
		throw new Error(body.detail ?? `Single image failed (${res.status})`);
	}
	return res.json();
}

export interface PlaceImageItem {
	image_id: string;
	place_id: string;
	file_path: string;
}

export interface PlaceImagesResponse {
	place_id: string;
	images: PlaceImageItem[];
	total: number;
}

export async function fetchBatchImages(
	placeId: string,
	limit: number = 4,
	signal?: AbortSignal,
): Promise<PlaceImagesResponse> {
	const params = new URLSearchParams({
		place_id: placeId,
		limit: limit.toString(),
	});
	const res = await fetch(apiV1(`/place-images?${params}`), {
		signal,
	});
	if (!res.ok) {
		const body = await res.json().catch(() => ({}));
		throw new Error(body.detail ?? `Batch images failed (${res.status})`);
	}
	return res.json();
}

/* ─── Review Summary API ───────────────────────────────────────────────────── */
export interface ReviewSummaryResponse {
	place_id: string;
	name: string;
	summary: string;
	positive_ratio: number;
	negative_ratio: number;
}

export interface ReviewSampleItem {
	id: number;
	text: string;
	rating: number;
}

export interface ReviewSamplesResponse {
	place_id: string;
	reviews: ReviewSampleItem[];
}

export async function fetchReviewSummary(
	placeId: string,
	targetLanguage: AppLanguage = "vi",
	signal?: AbortSignal,
): Promise<ReviewSummaryResponse> {
	const params = new URLSearchParams({
		place_id: placeId,
		target_language: targetLanguage,
	});
	const res = await fetch(apiV1(`/review-summary?${params}`), {
		signal,
	});
	if (!res.ok) {
		const body = await res.json().catch(() => ({}));
		throw new Error(body.detail ?? `Review summary failed (${res.status})`);
	}
	return res.json();
}

export async function fetchReviewSamples(
	placeId: string,
	limit: number = 3,
	signal?: AbortSignal,
): Promise<ReviewSamplesResponse> {
	const params = new URLSearchParams({
		place_id: placeId,
		limit: limit.toString(),
	});
	const res = await fetch(apiV1(`/review-summary/samples?${params}`), {
		signal,
	});
	if (!res.ok) {
		const body = await res.json().catch(() => ({}));
		throw new Error(body.detail ?? `Review samples failed (${res.status})`);
	}
	return res.json();
}
