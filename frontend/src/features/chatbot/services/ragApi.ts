import axios from "axios";
import { apiV1 } from "../../../config/api";
import type { AppLanguage } from "../../../hooks/useLanguage";

const RAG_API_URL = apiV1("/rag");

export interface RagChatRequest {
	message: string;
	top_k?: number;
	target_language?: AppLanguage;
}

export interface RagSourcePlace {
	place_id?: string;
	place_name?: string;
	address?: string;
	district?: string;
	city?: string;
	avg_rating?: number;
	positive_ratio?: number;
	negative_ratio?: number;
	score: number;
	content_preview: string;
}

export interface RagChatResponse {
	answer: string;
	sources: RagSourcePlace[];
}

/**
 * Send a message to the RAG chatbot and receive an AI-generated answer
 * along with source places used for the response.
 */
export async function sendRagChat(
	request: RagChatRequest,
): Promise<RagChatResponse> {
	const response = await axios.post<RagChatResponse>(`${RAG_API_URL}/chat`, {
		message: request.message,
		top_k: request.top_k ?? 5,
		target_language: request.target_language ?? "vi",
	});
	return response.data;
}
