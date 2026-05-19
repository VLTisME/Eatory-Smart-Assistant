import json
import shutil
from pathlib import Path
from typing import Any, Dict, List

from langchain_core.documents import Document
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma


BASE_DIR = Path(__file__).resolve().parent

INPUT_PATH = BASE_DIR / "rag_documents.json"
CHROMA_DIR = BASE_DIR / "chroma_db"

COLLECTION_NAME = "places_rag"
EMBEDDING_MODEL = "AITeamVN/Vietnamese_Embedding"


def load_json(path: Path) -> List[Dict[str, Any]]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def clean_metadata(metadata: Dict[str, Any]) -> Dict[str, Any]:
    """
    Chroma metadata chỉ nên chứa kiểu đơn giản:
    str, int, float, bool, None.

    List như derived_categories phải convert sang string.
    """
    cleaned = {}

    for key, value in metadata.items():
        if isinstance(value, list):
            cleaned[key] = ", ".join(map(str, value))
        elif value is None:
            cleaned[key] = ""
        else:
            cleaned[key] = value

    return cleaned


def convert_to_langchain_documents(rag_documents: List[Dict[str, Any]]) -> List[Document]:
    documents = []

    for doc in rag_documents:
        metadata = clean_metadata(doc.get("metadata", {}))

        metadata["doc_id"] = doc.get("id", "")

        documents.append(
            Document(
                page_content=doc["content"],
                metadata=metadata,
            )
        )

    return documents


def build_embeddings() -> HuggingFaceEmbeddings:
    return HuggingFaceEmbeddings(
        model_name=EMBEDDING_MODEL,
        model_kwargs={
            "device": "cuda",
            "trust_remote_code": True,
        },
        encode_kwargs={
            "normalize_embeddings": True,
        },
    )


def reset_chroma_dir() -> None:
    if CHROMA_DIR.exists():
        shutil.rmtree(CHROMA_DIR)


def main() -> None:
    print("Loading RAG documents...")
    rag_documents = load_json(INPUT_PATH)

    print(f"Converting {len(rag_documents)} documents to LangChain Document...")
    documents = convert_to_langchain_documents(rag_documents)

    print(f"Loading embedding model: {EMBEDDING_MODEL}")
    embeddings = build_embeddings()

    print("Resetting old Chroma DB...")
    reset_chroma_dir()

    print("Building Chroma DB...")
    vector_db = Chroma.from_documents(
        documents=documents,
        embedding=embeddings,
        collection_name=COLLECTION_NAME,
        persist_directory=str(CHROMA_DIR),
    )

    print(f"Saved Chroma DB to: {CHROMA_DIR}")
    print(f"Total documents: {len(documents)}")


if __name__ == "__main__":
    main()