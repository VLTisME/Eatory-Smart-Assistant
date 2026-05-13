# -*- coding: utf-8 -*-
"""
query_images.py — Smart Tourism | Image Query Module & API
==========================================================
Script cung cap cac ham truy xuat anh va API server (FastAPI).

3 chuc nang chinh:
  1. get_image_by_id(image_id)        -> Truy van 1 anh theo PK
  2. get_images_by_ids(image_ids)     -> Truy van batch nhieu anh theo list PK
  3. get_random_image_by_place(place) -> Truy van ngau nhien 1 anh cua quan

Yeu cau:
  pip install supabase python-dotenv fastapi uvicorn

Chay API Server:
  python query_images.py
  (Hoac: uvicorn query_images:app --reload)
"""

import os
import random
from typing import List, Optional
from dotenv import load_dotenv
from supabase import create_client, Client
from fastapi import FastAPI, HTTPException, Query
import uvicorn

load_dotenv()

app = FastAPI(
    title="Smart Tourism Image API",
    description="API truy xuat hinh anh dia diem tu Supabase & Cloudinary",
    version="1.0.0"
)

# Setup Supabase client

def _get_client() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not url or not key:
        raise EnvironmentError(
            "Thieu SUPABASE_URL hoac SUPABASE_SERVICE_KEY trong .env"
        )
    return create_client(url, key)


# CORE FUNCTIONS 

def get_image_by_id(image_id: str) -> Optional[dict]:
    """
    1. Query 1 PK (image_id) -> tra ve 1 anh.
    (PK la duy nhat, dai dien cho 1 anh cua 1 quan)
    """
    supabase = _get_client()
    resp = (
        supabase.table("image_embeddings")
        .select("image_id, place_id, file_path")
        .eq("image_id", image_id)
        .limit(1)
        .execute()
    )
    return resp.data[0] if resp.data else None


def get_images_by_ids(image_ids: List[str]) -> List[dict]:
    """
    2. Query batch -> nhan vao k (image_id) -> tra ve k anh.
    (Moi image_id tuong ung voi 1 quan)
    """
    if not image_ids:
        return []
    
    supabase = _get_client()
    resp = (
        supabase.table("image_embeddings")
        .select("image_id, place_id, file_path")
        .in_("image_id", image_ids)
        .execute()
    )
    return resp.data or []


def get_random_image_by_place(place_id: str) -> Optional[dict]:
    """
    3. Query 1 place_id -> tra ve random 1 anh cua quan do.
    """
    supabase = _get_client()
    resp = (
        supabase.table("image_embeddings")
        .select("image_id, place_id, file_path")
        .eq("place_id", place_id)
        .execute()
    )
    if not resp.data:
        return None
    return random.choice(resp.data)


# API ENDPOINTS (FastAPI)

@app.get("/api/images/{image_id}", tags=["Images"])
def api_get_image_by_id(image_id: str):
    """
    Truy van thong tin 1 buc anh dua tren image_id (PK).
    """
    data = get_image_by_id(image_id)
    if not data:
        raise HTTPException(status_code=404, detail="Khong tim thay anh voi image_id nay")
    return data


@app.get("/api/images", tags=["Images"])
def api_get_images_by_ids(
    ids: List[str] = Query(..., description="Danh sach image_id. VD: ?ids=id1&ids=id2")
):
    """
    Truy van nhieu buc anh cung luc theo danh sach image_id.
    """
    data = get_images_by_ids(ids)
    return {
        "count": len(data),
        "data": data
    }


@app.get("/api/places/{place_id}/image/random", tags=["Places"])
def api_get_random_image(place_id: str):
    """
    Truy van ngau nhien 1 buc anh cua mot dia diem (place_id).
    """
    data = get_random_image_by_place(place_id)
    if not data:
        raise HTTPException(status_code=404, detail="Dia diem nay khong co anh hoac khong ton tai")
    return data


# MAIN ENTRY POINT (Run Server)

if __name__ == "__main__":
    print("=" * 60)
    print("   Khoi dong Smart Tourism Image API Server")
    print("  URL: http://localhost:8000")
    print("  Tai lieu API (Swagger UI): http://localhost:8000/docs")
    print("=" * 60)
    
    # Chay server FastAPI bang uvicorn
    uvicorn.run("query_images:app", host="0.0.0.0", port=8000, reload=True)
