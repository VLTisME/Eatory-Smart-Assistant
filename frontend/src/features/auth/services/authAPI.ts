import { auth } from "../../../firebaseConfig";
import { apiV1 } from "../../../config/api";

export const fetchWithAuth = async (
	endpoint: string,
	options: RequestInit = {},
) => {
	let token = localStorage.getItem("token");
	if (auth?.currentUser) {
		token = await auth.currentUser.getIdToken();
	}

	const res = await fetch(apiV1(endpoint), {
		...options,
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
			...(options.headers || {}),
		},
	});

	if (!res.ok) {
		throw new Error("API error");
	}

	return res.json();
};
