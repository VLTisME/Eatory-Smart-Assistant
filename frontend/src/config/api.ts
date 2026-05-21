const DEFAULT_API_BASE_URL = "http://localhost:8000";
const DEFAULT_IMAGEKIT_PUBLIC_KEY = "public_BZTsXidbjAfF/2fLGhzF8TTE4QU=";

const rawApiBaseUrl =
	(import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ||
	DEFAULT_API_BASE_URL;

export const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, "");
export const API_V1_BASE_URL = `${API_BASE_URL}/api/v1`;

export const IMAGEKIT_PUBLIC_KEY =
	(import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY as string | undefined)?.trim() ||
	DEFAULT_IMAGEKIT_PUBLIC_KEY;

export function apiV1(path = ""): string {
	if (!path) return API_V1_BASE_URL;
	const normalizedPath = path.startsWith("/") ? path : `/${path}`;
	return `${API_V1_BASE_URL}${normalizedPath}`;
}
