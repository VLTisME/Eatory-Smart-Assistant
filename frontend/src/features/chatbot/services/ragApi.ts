import axios from "axios";

const RAG_API_URL = "http://localhost:8000/api/v1/rag";

export interface RagChatRequest {
	message: string;
	top_k?: number;
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
	});
	return response.data;
}
