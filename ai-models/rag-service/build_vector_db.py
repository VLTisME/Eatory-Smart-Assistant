import json
import shutil
import sys
from pathlib import Path
from typing import Any, Dict, List

import torch

from langchain_core.documents import Document
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma

from app.config import settings

BASE_DIR = Path(__file__).resolve().parent

INPUT_PATH = BASE_DIR / "rag_documents.json"

CHROMA_DIR = Path(settings.rag_chroma_dir)
COLLECTION_NAME = settings.rag_collection_name
EMBEDDING_MODEL = settings.rag_embedding_model
EMBEDDING_DEVICE = settings.rag_embedding_device
BATCH_SIZE = 64


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
            "device": EMBEDDING_DEVICE,
            "trust_remote_code": True,
        },
        encode_kwargs={
            "normalize_embeddings": True,
        },
    )


def reset_chroma_dir() -> None:
    if CHROMA_DIR.exists():
        shutil.rmtree(CHROMA_DIR)


def get_device_description() -> str:
    if EMBEDDING_DEVICE == "cuda" and torch.cuda.is_available():
        return f"cuda ({torch.cuda.get_device_name(0)})"

    return "cpu"


def print_progress(current: int, total: int, prefix: str = "Progress") -> None:
    bar_width = 30
    progress = current / total if total else 1
    filled = int(bar_width * progress)
    bar = "#" * filled + "-" * (bar_width - filled)

    sys.stdout.write(
        f"\r{prefix}: [{bar}] {current}/{total} ({progress * 100:5.1f}%)"
    )
    sys.stdout.flush()

    if current >= total:
        sys.stdout.write("\n")


def build_vector_db(
    documents: List[Document],
    embeddings: HuggingFaceEmbeddings,
) -> Chroma:
    vector_db = Chroma(
        collection_name=COLLECTION_NAME,
        embedding_function=embeddings,
        persist_directory=str(CHROMA_DIR),
    )

    total_documents = len(documents)
    print_progress(0, total_documents, prefix="Building Chroma DB")

    for start in range(0, total_documents, BATCH_SIZE):
        batch = documents[start : start + BATCH_SIZE]
        vector_db.add_documents(documents=batch)
        print_progress(
            min(start + len(batch), total_documents),
            total_documents,
            prefix="Building Chroma DB",
        )

    return vector_db


def main() -> None:
    print("Loading RAG documents...")
    rag_documents = load_json(INPUT_PATH)

    print(f"Converting {len(rag_documents)} documents to LangChain Document...")
    documents = convert_to_langchain_documents(rag_documents)

    print(f"Loading embedding model: {EMBEDDING_MODEL}")
    embeddings = build_embeddings()

    print("Resetting old Chroma DB...")
    reset_chroma_dir()

    print(f"Using embedding device: {get_device_description()}")
    print("Building Chroma DB...")
    vector_db = build_vector_db(documents, embeddings)

    print(f"Saved Chroma DB to: {CHROMA_DIR}")
    print(f"Total documents: {len(documents)}")


if __name__ == "__main__":
    main()
