import axios from "axios";
import type { PlaceSearchResponse } from "../../../types/placeSearch";
import { apiV1 } from "../../../config/api";

const API_BASE = apiV1("/place-search");
const REQUEST_TIMEOUT_MS = 180_000;
const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 1_200;

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetryUpload(error: unknown): boolean {
	if (!axios.isAxiosError(error)) return false;

	const status = error.response?.status;
	return (
		error.code === "ECONNABORTED" ||
		!error.response ||
		(typeof status === "number" && status >= 500 && status < 600)
	);
}

export async function uploadPlaceSearchImage(
	file: File,
	targetLang = "vi",
): Promise<PlaceSearchResponse> {
	const formData = new FormData();
	formData.append("file", file);

	for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
		try {
			const { data } = await axios.post<PlaceSearchResponse>(
				API_BASE,
				formData,
				{
					params: { target_language: targetLang },
					headers: { "Content-Type": "multipart/form-data" },
					timeout: REQUEST_TIMEOUT_MS,
				},
			);
			return data;
		} catch (error) {
			const isLastAttempt = attempt >= MAX_RETRIES;
			if (isLastAttempt || !shouldRetryUpload(error)) {
				throw error;
			}
			await sleep(RETRY_DELAY_MS);
		}
	}

	throw new Error("Place search upload failed after retry.");
}
