import axios from "axios";
import type { MenuResponse } from "../../../types/menuTranslation";
import type { PlaceSearchResponse } from "../../../types/placeSearch";
const API_BASE_URL = "http://localhost:8000/api/v1/chat/conversations";

export interface Message {
	id: string;
	role: "user" | "bot";
	content: string;
	image_url?: string | null;
	menu_data?: MenuResponse | null;
	place_search_data?: PlaceSearchResponse | null;
	created_at: string | Date;
}

export interface Conversation {
	id: string;
	title: string;
	created_at: string | Date;
	updated_at: string | Date;
}

export interface ConversationDetail extends Conversation {
	messages: Message[];
}

export interface MessageCreatePayload {
	role: "user" | "bot";
	content: string;
	image_url?: string | null;
	menu_data?: MenuResponse | null;
	place_search_data?: PlaceSearchResponse | null;
}

export const getConversations = async (
	token: string,
): Promise<Conversation[]> => {
	const reponse = await axios.get<Conversation[]>(`${API_BASE_URL}/`, {
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
	});
	return reponse.data;
};

export const createConversation = async (
	token: string,
	title: string,
): Promise<Conversation> => {
	const reponse = await axios.post<Conversation>(
		`${API_BASE_URL}/`,
		{ title },
		{
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
		},
	);
	return reponse.data;
};

export const getConversationDetail = async (
	token: string,
	convID: string,
): Promise<ConversationDetail> => {
	const response = await axios.get<ConversationDetail>(
		`${API_BASE_URL}/${convID}/`,
		{
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
		},
	);
	return response.data;
};

export const sendMessage = async (
	token: string,
	convId: string,
	payload: MessageCreatePayload,
): Promise<Message> => {
	const response = await axios.post<Message>(
		`${API_BASE_URL}/${convId}/messages/`,
		payload,
		{
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
		},
	);
	return response.data;
};

export const deleteConversation = async (
	token: string,
	convID: string,
): Promise<boolean> => {
	const response = await axios.delete(`${API_BASE_URL}/${convID}/`, {
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
	});
	return response.status >= 200 && response.status < 300;
};
