import asyncio

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from database import init_db
from scraper import process_url_queue
from schema import UrlInput

app = FastAPI(title="Google Maps Hybrid Scraper V2")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

url_queue = asyncio.Queue()


@app.on_event("startup")
async def startup_event():
    logger.info("Init database")
    init_db()

    logger.info("Start worker pool")
    asyncio.create_task(process_url_queue(url_queue))


@app.post("/add-url")
async def add_url(data: UrlInput):
    url = str(data.url)
    await url_queue.put(url)
    queue_size = url_queue.qsize()
    logger.info(f"Queued URL: {queue_size}")
    return {"message": "URL queued", "queue_size": queue_size}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("server:app", host="localhost", port=8000, reload=True)
