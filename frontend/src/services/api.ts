import { auth } from "../firebase";

const BASE_URL = "http://localhost:8000/api/v1";

export const fetchWithAuth = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  let token = localStorage.getItem("token");
  if (auth?.currentUser) {
    token = await auth.currentUser.getIdToken();
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
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