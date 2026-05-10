import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api/v1/imagekit";

/** ImageKit public key — exposed to the client (safe). */
const IMAGEKIT_PUBLIC_KEY = "public_BZTsXidbjAfF/2fLGhzF8TTE4QU=";

export interface ImageKitAuthResponse {
	token: string;
	expire: number;
	signature: string;
}

export interface ImageKitUploadResult {
	url: string;
	fileId: string;
	name: string;
	thumbnailUrl?: string;
}

/**
 * Step 1: Fetch auth parameters (signature, token, expire) from our backend.
 * The backend signs the request using the private key.
 */
export const getImageKitAuth = async (
	firebaseToken: string,
): Promise<ImageKitAuthResponse> => {
	const response = await axios.get<ImageKitAuthResponse>(
		`${API_BASE_URL}/auth`,
		{
			headers: {
				Authorization: `Bearer ${firebaseToken}`,
			},
		},
	);
	return response.data;
};

/**
 * Step 2: Upload a file directly to ImageKit's upload API.
 * Uses the auth params from our backend + the public key.
 */
export const uploadToImageKit = async (
	file: File,
	firebaseToken: string,
): Promise<ImageKitUploadResult> => {
	// 1. Get authentication parameters from our backend
	const authParams = await getImageKitAuth(firebaseToken);

	// 2. Build multipart form for ImageKit upload API
	const formData = new FormData();
	formData.append("file", file);
	formData.append("fileName", file.name);
	formData.append("publicKey", IMAGEKIT_PUBLIC_KEY);
	formData.append("signature", authParams.signature);
	formData.append("expire", authParams.expire.toString());
	formData.append("token", authParams.token);

	// 3. POST directly to ImageKit upload API
	const response = await axios.post(
		"https://upload.imagekit.io/api/v1/files/upload",
		formData,
		{
			headers: { "Content-Type": "multipart/form-data" },
		},
	);

	return {
		url: response.data.url,
		fileId: response.data.fileId,
		name: response.data.name,
		thumbnailUrl: response.data.thumbnailUrl,
	};
};
