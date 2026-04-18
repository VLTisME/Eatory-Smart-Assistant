import asyncio
import hashlib
import os
import random
import re
from datetime import datetime, timedelta

from loguru import logger
from playwright.async_api import TimeoutError as PlaywrightTimeout, async_playwright
from playwright_stealth import Stealth
from sqlalchemy import select

from classifier import classify_place_type
from database import SessionLocal
from models import Place, Review

MAX_WORKERS = 3
MAX_REVIEWS = 60
REST_BETWEEN_URLS = (15, 35)
USER_DATA_DIRS = [f"./chrome_user_data_{i}" for i in range(MAX_WORKERS)]
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
]
MIN_REVIEWS_REQUIRED = MAX_REVIEWS
REQUIRED_PLACE_FIELDS = ("name", "address", "lat", "lng", "avg_rating", "total_reviews")
ADDRESS_SELECTORS = (
    'button[data-item-id="address"]',
    '[aria-label^="Địa chỉ"]',
    '[aria-label^="Address"]',
)
CATEGORY_SELECTORS = (
    'button.DkEaL',
    '.fontBodyMedium:has-text("Quán")',
    '.fontBodyMedium:has-text("Nhà hàng")',
    '.fontBodyMedium:has-text("Chùa")',
)
REVIEW_SELECTOR = ".jftiEf"


async def random_human_behavior(page):
    viewport_size = page.viewport_size
    if not viewport_size:
        return

    width = viewport_size["width"]
    height = viewport_size["height"]
    sidebar_width = min(450, width)
    x = random.randint(10, sidebar_width - 10)
    y = random.randint(50, height - 50)

    await page.mouse.move(x, y, steps=random.randint(5, 15))
    await asyncio.sleep(random.uniform(1.5, 3.5))
    await page.mouse.wheel(delta_x=0, delta_y=random.randint(300, 800))


def parse_relative_date(time_str: str) -> datetime:
    now = datetime.now()
    if not time_str:
        return now

    text = time_str.lower()
    value = 1
    match = re.search(r"\d+", text)
    if match:
        value = int(match.group())

    if "năm" in text or "year" in text:
        return now - timedelta(days=value * 365)
    if "tháng" in text or "month" in text:
        return now - timedelta(days=value * 30)
    if "tuần" in text or "week" in text:
        return now - timedelta(days=value * 7)
    if "ngày" in text or "day" in text:
        return now - timedelta(days=value)
    if "giờ" in text or "hour" in text:
        return now - timedelta(hours=value)
    if "phút" in text or "minute" in text:
        return now - timedelta(minutes=value)
    return now


def validate_before_save(place_data: dict, reviews_data: list) -> str | None:
    if len(reviews_data) < MIN_REVIEWS_REQUIRED:
        return f"Only {len(reviews_data)}/{MIN_REVIEWS_REQUIRED} reviews"

    for field in REQUIRED_PLACE_FIELDS:
        value = place_data.get(field)
        if value in (None, "", 0, 0.0):
            return f"Missing field: {field}"

    for index, review in enumerate(reviews_data):
        if not review.get("review_id"):
            return f"Review #{index} missing id"
        if len(review.get("text", "").strip()) < 5:
            return f"Review #{index} missing text"

    return None


def save_reviews_to_db(place_data: dict, reviews_data: list):
    rejection = validate_before_save(place_data, reviews_data)
    if rejection:
        logger.warning(f"Skip save: {rejection}")
        return

    db = SessionLocal()
    try:
        url = place_data["source_url"]
        place_id = hashlib.md5(url.encode("utf-8")).hexdigest()
        address = place_data.get("address", "")

        place = db.get(Place, place_id)
        if not place:
            place = Place(
                place_id=place_id,
                source="google_maps",
                name=place_data.get("name"),
                type=place_data.get("type"),
                address=address,
                district=address,
                city=address,
                lat=place_data.get("lat"),
                lng=place_data.get("lng"),
                avg_rating=place_data.get("avg_rating"),
                total_reviews=place_data.get("total_reviews"),
            )
            db.add(place)
        else:
            place.name = place_data.get("name") or place.name
            place.type = place_data.get("type") or place.type
            place.address = address or place.address
            place.district = address or place.district
            place.city = address or place.city
            if place_data.get("lat") and place_data.get("lng"):
                place.lat = place_data["lat"]
                place.lng = place_data["lng"]
            if place_data.get("avg_rating"):
                place.avg_rating = place_data["avg_rating"]
            if place_data.get("total_reviews"):
                place.total_reviews = place_data["total_reviews"]

        review_ids = [review["review_id"] for review in reviews_data]
        existing_ids = set(
            db.scalars(select(Review.review_id).where(Review.review_id.in_(review_ids))).all()
        )
        saved_count = 0

        for review in reviews_data:
            if review["review_id"] in existing_ids:
                continue

            db.add(
                Review(
                    place_id=place_id,
                    review_id=review["review_id"],
                    text=review["text"],
                    rating=int(review["rating"]) if review["rating"] else 0,
                    timestamp=parse_relative_date(review["timestamp"]),
                    source="google_maps",
                )
            )
            saved_count += 1

        db.commit()
        logger.info(f"Saved {saved_count} reviews: {place_data.get('name')}")
    except Exception as exc:
        db.rollback()
        logger.error(f"DB rollback: {exc}")
    finally:
        db.close()


async def detect_place_type(page, place_name: str) -> str | None:
    place_type = classify_place_type(place_name)
    if place_type:
        return place_type

    for selector in CATEGORY_SELECTORS:
        try:
            element = await page.query_selector(selector)
            if not element:
                continue

            text = await element.inner_text()
            place_type = classify_place_type(text)
            if place_type:
                return place_type
        except Exception:
            continue

    return None


async def extract_address(page) -> str:
    for selector in ADDRESS_SELECTORS:
        try:
            element = await page.wait_for_selector(selector, state="attached", timeout=4000)
            if not element:
                continue

            raw_address = await element.get_attribute("aria-label")
            if not raw_address:
                raw_address = await element.inner_text()
            if not raw_address:
                continue

            clean_address = re.sub(
                r"^(Địa chỉ:\s*|Address:\s*|Adresse:\s*)",
                "",
                raw_address,
                flags=re.IGNORECASE,
            )
            return max(clean_address.split("\n"), key=len).strip()
        except Exception:
            continue

    return ""


def extract_coordinates(current_url: str) -> tuple[float, float]:
    exact_match = re.search(r"!3d([-\d.]+)!4d([-\d.]+)", current_url)
    if exact_match:
        return float(exact_match.group(1)), float(exact_match.group(2))

    viewport_match = re.search(r"@([-\d.]+),([-\d.]+)", current_url)
    if viewport_match:
        return float(viewport_match.group(1)), float(viewport_match.group(2))

    return 0.0, 0.0


async def extract_place_data(page, source_url: str) -> dict:
    place_data = {
        "source_url": source_url,
        "name": "",
        "type": None,
        "address": "",
        "lat": 0.0,
        "lng": 0.0,
        "avg_rating": 0.0,
        "total_reviews": 0,
    }

    try:
        name_element = await page.wait_for_selector("h1", state="attached", timeout=5000)
        if name_element:
            place_data["name"] = await name_element.inner_text()
    except Exception:
        pass

    try:
        rating_element = await page.wait_for_selector("div.F7nice", state="attached", timeout=4000)
        if rating_element:
            rating_text = await rating_element.inner_text()
            avg_rating_match = re.search(r"(\d+[.,]\d+|\d+)", rating_text)
            total_reviews_match = re.search(r"\(([\d.,]+)\)", rating_text)

            if avg_rating_match:
                place_data["avg_rating"] = float(avg_rating_match.group(1).replace(",", "."))
            if total_reviews_match:
                place_data["total_reviews"] = int(re.sub(r"[.,]", "", total_reviews_match.group(1)))
    except Exception:
        pass

    place_data["type"] = await detect_place_type(page, place_data["name"])
    place_data["address"] = await extract_address(page)
    place_data["lat"], place_data["lng"] = extract_coordinates(page.url)
    return place_data


async def collect_reviews(page) -> list[dict]:
    await page.wait_for_selector(REVIEW_SELECTOR, timeout=45000)

    reviews = []
    seen_ids = set()
    review_container = page.locator(REVIEW_SELECTOR).first
    await review_container.hover()

    while len(reviews) < MAX_REVIEWS:
        await random_human_behavior(page)
        review_elements = await page.query_selector_all(REVIEW_SELECTOR)

        for element in review_elements:
            if len(reviews) >= MAX_REVIEWS:
                break

            review_id = await element.get_attribute("data-review-id")
            if not review_id or review_id in seen_ids:
                continue

            try:
                stars = await element.query_selector('span[role="img"]')
                rating_label = await stars.get_attribute("aria-label") if stars else ""
                rating_match = re.search(r"(\d+[.,]\d+|\d+)", rating_label)
                rating = float(rating_match.group().replace(",", ".")) if rating_match else 0.0

                text_element = await element.query_selector(".wiI7pd")
                text = await text_element.inner_text() if text_element else ""
                if len(text.strip()) < 5 or not re.search(r"\w", text):
                    continue

                time_element = await element.query_selector(".rsqaWe")
                timestamp = await time_element.inner_text() if time_element else ""

                seen_ids.add(review_id)
                reviews.append(
                    {
                        "review_id": review_id,
                        "text": text,
                        "rating": rating,
                        "timestamp": timestamp,
                    }
                )
            except Exception as exc:
                logger.warning(f"Review parse failed: {exc}")

    return reviews


async def scrape_google_maps_reviews(url: str, user_data_dir: str):
    logger.info(f"Start scrape: {url}")

    async with async_playwright() as playwright:
        os.makedirs(user_data_dir, exist_ok=True)

        try:
            context = await playwright.chromium.launch_persistent_context(
                user_data_dir,
                headless=True,
                user_agent=random.choice(USER_AGENTS),
                viewport={"width": 1366, "height": 768},
                locale="vi-VN",
                args=["--disable-blink-features=AutomationControlled"],
            )
            page = context.pages[0] if context.pages else await context.new_page()
        except Exception as exc:
            logger.error(f"Browser init failed: {exc}")
            return

        stealth = Stealth()
        await stealth.apply_stealth_async(page)

        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=60000)
            await asyncio.sleep(7)

            place_data = await extract_place_data(page, url)
            logger.info(
                f"Place: {place_data['name']} | {place_data['address']} | "
                f"{place_data['lat']}, {place_data['lng']} | {place_data['type']}"
            )

            try:
                review_tab = page.locator('button[role="tab"]').filter(
                    has_text=re.compile(r"^(Đánh giá|Bài đánh giá|Reviews)$", re.IGNORECASE)
                ).first
                if await review_tab.is_visible(timeout=5000):
                    await review_tab.click()
                    await asyncio.sleep(3)
            except Exception as exc:
                logger.warning(f"Reviews tab unavailable: {exc}")

            logger.info("Wait reviews")
            reviews_data = await collect_reviews(page)
            logger.info(f"Collected {len(reviews_data)} reviews")
            await asyncio.to_thread(save_reviews_to_db, place_data, reviews_data)
        except PlaywrightTimeout:
            logger.warning("Review section not found")
        except Exception as exc:
            logger.error(f"Scrape failed: {exc}")
        finally:
            await context.close()


async def worker(worker_id: int, queue: asyncio.Queue, user_data_dir: str):
    logger.info(f"[Worker-{worker_id}] Ready")

    while True:
        url = await queue.get()
        logger.info(f"[Worker-{worker_id}] Picked URL")

        try:
            await scrape_google_maps_reviews(url, user_data_dir)
        except Exception as exc:
            logger.error(f"[Worker-{worker_id}] Failed: {exc}")
        finally:
            queue.task_done()

        rest_time = random.randint(*REST_BETWEEN_URLS)
        logger.info(f"[Worker-{worker_id}] Sleep {rest_time}s")
        await asyncio.sleep(rest_time)


async def process_url_queue(queue: asyncio.Queue):
    logger.info(f"Start {MAX_WORKERS} workers")

    for user_data_dir in USER_DATA_DIRS:
        os.makedirs(user_data_dir, exist_ok=True)

    tasks = [
        asyncio.create_task(worker(index + 1, queue, USER_DATA_DIRS[index]))
        for index in range(MAX_WORKERS)
    ]

    logger.info("Workers ready")
    await asyncio.gather(*tasks)
