from pathlib import Path
from typing import List

from openai import OpenAI
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma

from app.config import settings
from app.prompts import build_rag_answer_prompt, build_rag_system_prompt

BASE_DIR = Path(__file__).resolve().parent


def build_embeddings() -> HuggingFaceEmbeddings:
    return HuggingFaceEmbeddings(
        model_name=settings.rag_embedding_model,
        model_kwargs={
            "device": settings.rag_embedding_device,
            "trust_remote_code": True,
        },
        encode_kwargs={
            "normalize_embeddings": True,
        },
    )


def load_vector_db() -> Chroma:
    embeddings = build_embeddings()

    return Chroma(
        collection_name=settings.rag_collection_name,
        persist_directory=settings.rag_chroma_dir,
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
        place_name = doc.metadata.get("place_name", "Unknown place")

        context_parts.append(
            f"""
[Place {i}]
Name: {place_name}
Similarity score: {score}

{doc.page_content}
""".strip()
        )

    return "\n\n---\n\n".join(context_parts)


def ask_openai(user_query: str, context: str, target_language: str = "vi") -> str:
    client = OpenAI()

    response = client.responses.create(
        model=settings.openai_model,
        input=[
            {
                "role": "system",
                "content": build_rag_system_prompt(target_language=target_language),
            },
            {
                "role": "user",
                "content": build_rag_answer_prompt(
                    user_query=user_query,
                    context=context,
                    target_language=target_language,
                ),
            },
        ],
    )

    return response.output_text


def answer_query(user_query: str, top_k: int = 5, target_language: str = "vi") -> str:
    results = retrieve(user_query, top_k=top_k)

    if not results:
        return settings.rag_no_results_message

    context = build_context(results)
    answer = ask_openai(user_query, context, target_language=target_language)

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
