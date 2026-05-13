from pathlib import Path
from typing import List

from openai import OpenAI
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma


BASE_DIR = Path(__file__).resolve().parent
CHROMA_DIR = BASE_DIR / "chroma_db"

COLLECTION_NAME = "places_rag"
EMBEDDING_MODEL = "AITeamVN/Vietnamese_Embedding"
OPENAI_MODEL = "gpt-5.5"


SYSTEM_PROMPT = """
Bạn là chatbot tư vấn ăn uống/du lịch tại TP.HCM.

Chỉ được trả lời dựa trên CONTEXT được cung cấp.
Không bịa giờ mở cửa, giá chính xác, số điện thoại, món best-seller nếu context không có.
Nếu context không đủ thông tin, hãy nói rõ là dữ liệu hiện tại chưa đủ.

Khi gợi ý địa điểm, hãy ưu tiên:
- Nhu cầu của người dùng
- Rating
- Tỷ lệ review tích cực
- Điểm mạnh / điểm yếu trong review

Cách trả lời:
- Ngắn gọn, tự nhiên
- Nêu 2-3 địa điểm phù hợp nhất nếu có
- Với mỗi địa điểm: lý do phù hợp, điểm mạnh, điểm cần lưu ý
"""


def build_embeddings() -> HuggingFaceEmbeddings:
    return HuggingFaceEmbeddings(
        model_name=EMBEDDING_MODEL,
        model_kwargs={
            "device": "cpu",
            "trust_remote_code": True,
        },
        encode_kwargs={
            "normalize_embeddings": True,
        },
    )


def load_vector_db() -> Chroma:
    embeddings = build_embeddings()

    return Chroma(
        collection_name=COLLECTION_NAME,
        persist_directory=str(CHROMA_DIR),
        embedding_function=embeddings,
    )


def retrieve(query: str, top_k: int = 5):
    vector_db = load_vector_db()

    results = vector_db.similarity_search_with_score(
        query=query,
        k=top_k,
    )

    return results


def build_context(results) -> str:
    context_parts: List[str] = []

    for i, (doc, score) in enumerate(results, start=1):
        place_name = doc.metadata.get("place_name", "Không rõ tên")

        context_parts.append(
            f"""
[Địa điểm {i}]
Tên: {place_name}
Similarity score: {score}

{doc.page_content}
""".strip()
        )

    return "\n\n---\n\n".join(context_parts)


def ask_openai(user_query: str, context: str) -> str:
    client = OpenAI()

    prompt = f"""
CONTEXT:
{context}

USER QUESTION:
{user_query}

Hãy trả lời dựa trên CONTEXT.
""".strip()

    response = client.responses.create(
        model=OPENAI_MODEL,
        input=[
            {
                "role": "system",
                "content": SYSTEM_PROMPT,
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
    )

    return response.output_text


def answer_query(user_query: str, top_k: int = 5) -> str:
    results = retrieve(user_query, top_k=top_k)

    if not results:
        return "Mình chưa tìm thấy địa điểm phù hợp trong dữ liệu hiện tại."

    context = build_context(results)
    answer = ask_openai(user_query, context)

    return answer


def main():
    while True:
        query = input("\nNhập câu hỏi, hoặc 'exit' để thoát: ").strip()

        if query.lower() in ["exit", "quit", "q"]:
            break

        answer = answer_query(query, top_k=5)
        print("\nAnswer:")
        print(answer)


if __name__ == "__main__":
    main()