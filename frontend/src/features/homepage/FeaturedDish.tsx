import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	RiArrowLeftLine,
	RiArrowRightLine,
	RiStarFill,
	RiMapPinLine,
} from "react-icons/ri";
import ScrollReveal from "./Animation/ScrollReveal";
import {
	fetchPlacesByCity,
	fetchRandomImage,
	fetchReviewSummary,
	type PlaceDetailItem,
} from "../map-search/services/placeAPI";
import { useLanguage } from "../../hooks/useLanguage";

const FEATURED_TEXT = {
	vi: {
		loading: "Đang tải...",
		highlyRated: "Đánh giá cao",
		reviews: "đánh giá",
		discover: "Khám phá ẩm thực tuyệt vời tại",
		loved: "— một trong những địa điểm được yêu thích nhất",
		in: "tại",
		inVn: "tại Việt Nam",
		explore: "Khám phá ngay",
	},
	en: {
		loading: "Loading...",
		highlyRated: "Highly Rated",
		reviews: "reviews",
		discover: "Discover amazing food at",
		loved: "— one of the most loved places",
		in: "in",
		inVn: "in Vietnam",
		explore: "Explore now",
	},
};

interface DishData {
	place: PlaceDetailItem;
	image: string;
}

const FALLBACK_DISHES: DishData[] = [
	{
		place: {
			place_id: "fallback-1",
			name: "Phở Bò Hà Nội",
			type: "restaurant",
			address: "Hà Nội, Việt Nam",
			location: { lat: 21.0285, lng: 105.8542 },
			avg_rating: 4.9,
			total_review: 2300,
		},
		image: "/featured_pho.png",
	},
	{
		place: {
			place_id: "fallback-2",
			name: "Bánh Mì Sài Gòn",
			type: "restaurant",
			address: "Hồ Chí Minh, Việt Nam",
			location: { lat: 10.7769, lng: 106.7009 },
			avg_rating: 4.8,
			total_review: 1800,
		},
		image: "/featured_banhmi.png",
	},
	{
		place: {
			place_id: "fallback-3",
			name: "Gỏi Cuốn Tôm",
			type: "restaurant",
			address: "Hồ Chí Minh, Việt Nam",
			location: { lat: 10.7769, lng: 106.7009 },
			avg_rating: 4.7,
			total_review: 1200,
		},
		image: "/featured_springrolls.png",
	},
	{
		place: {
			place_id: "fallback-4",
			name: "Bún Chả Hà Nội",
			type: "restaurant",
			address: "Hà Nội, Việt Nam",
			location: { lat: 21.0285, lng: 105.8542 },
			avg_rating: 4.9,
			total_review: 1500,
		},
		image: "/featured_buncha.png",
	},
];

interface FeaturedDishProps {
	province?: string;
}

export default function FeaturedDish({ province }: FeaturedDishProps) {
	const [current, setCurrent] = useState(0);
	const [direction, setDirection] = useState(0);
	const [dishes, setDishes] = useState<DishData[]>(FALLBACK_DISHES);
	const [isLoading, setIsLoading] = useState(false);
	const { lang } = useLanguage();
	const t = FEATURED_TEXT[lang];

	const loadDishes = useCallback(async (city: string) => {
		if (!city) return;

		setIsLoading(true);
		try {
			const placesRes = await fetchPlacesByCity(city, 4);
			if (!placesRes.data || placesRes.data.length === 0) {
				return;
			}

			const dishPromises = placesRes.data.map(async (place: PlaceDetailItem) => {
				let image = "";
				let review = "";
				try {
					const [imgRes, reviewRes] = await Promise.all([
						fetchRandomImage(place.place_id).catch(() => ({
							file_path: "",
						})),
						fetchReviewSummary(place.place_id).catch(() => ({
							summary: "",
						})),
					]);
					image = imgRes.file_path;
					review = reviewRes.summary;
				} catch {
					// Ignored
				}
				return {
					place: { ...place, review },
					image,
				} as DishData;
			});
			const loadedDishes = await Promise.all(dishPromises);
			if (loadedDishes.length > 0) {
				setDishes(loadedDishes);
				setCurrent(0);
			}
		} catch (error) {
			console.error("Failed to load featured dishes:", error);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		if (province) {
			loadDishes(province);
		}
	}, [province, loadDishes]);

	const dish = dishes[current];

	const prev = () => {
		setDirection(-1);
		setCurrent((c) => (c - 1 + dishes.length) % dishes.length);
	};
	const next = () => {
		setDirection(1);
		setCurrent((c) => (c + 1) % dishes.length);
	};

	return (
		<section className="relative overflow-hidden bg-linear-to-br from-blue-50 via-white to-sky-50 py-24 px-4 lg:px-16">
			<div className="pointer-events-none absolute top-16 left-8 h-32 w-32 rounded-full bg-blue-100/40" />
			<div className="pointer-events-none absolute right-12 bottom-20 h-48 w-48 rounded-full bg-sky-100/50" />
			<div className="pointer-events-none absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-50/30" />

			<div className="relative z-10 mx-auto max-w-7xl">
				<div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
					<ScrollReveal delay={0.1}>
						<div className="relative flex items-center justify-center">
							<button
								onClick={prev}
								disabled={isLoading}
								className="absolute left-0 z-20 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-white shadow-lg transition-all hover:scale-110 hover:bg-blue-50 lg:-left-6 disabled:opacity-50"
							>
								<RiArrowLeftLine className="text-lg text-blue-600" />
							</button>
							<div className="relative">
								<div className="absolute inset-0 scale-90 rounded-full bg-linear-to-br from-blue-200 to-sky-200 opacity-50 blur-3xl" />
								{isLoading ? (
									<div className="relative z-10 flex h-80 w-[320px] items-center justify-center rounded-4xl bg-linear-to-br from-blue-100 to-sky-100 shadow-2xl md:h-105 md:w-105">
										<div className="flex flex-col items-center gap-3">
											<div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-200 border-t-blue-500" />
											<span className="text-sm font-medium text-blue-400">
												{t.loading}
											</span>
										</div>
									</div>
								) : (
									<AnimatePresence mode="wait">
										<motion.div
											key={current}
											initial={{
												opacity: 0,
												x: direction >= 0 ? 80 : -80,
												scale: 0.85,
												rotateY:
													direction >= 0 ? 15 : -15,
											}}
											animate={{
												opacity: 1,
												x: 0,
												scale: 1,
												rotateY: 0,
											}}
											exit={{
												opacity: 0,
												x: direction >= 0 ? -80 : 80,
												scale: 0.85,
												rotateY:
													direction >= 0 ? -15 : 15,
											}}
											transition={{
												duration: 0.5,
												ease: [0.25, 0.46, 0.45, 0.94],
											}}
											className="relative"
										>
											{dish.image ? (
												<img
													src={dish.image}
													alt={dish.place.name}
													className="relative z-10 h-80 w-[320px] rounded-4xl object-cover shadow-2xl md:h-105 md:w-105"
												/>
											) : (
												<div className="relative z-10 flex h-80 w-[320px] items-center justify-center rounded-4xl bg-linear-to-br from-blue-200 to-sky-300 shadow-2xl md:h-105 md:w-105">
													<span className="text-6xl">
														🍜
													</span>
												</div>
											)}
											{dish.place.type && (
												<div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 rounded-full bg-linear-to-r from-blue-500 to-sky-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
													<RiMapPinLine className="text-sm" />
													{dish.place.type}
												</div>
											)}
										</motion.div>
									</AnimatePresence>
								)}
							</div>

							<button
								onClick={next}
								disabled={isLoading}
								className="absolute right-0 z-20 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-white shadow-lg transition-all hover:scale-110 hover:bg-blue-50 lg:-right-6 disabled:opacity-50"
							>
								<RiArrowRightLine className="text-lg text-blue-600" />
							</button>
							<div className="absolute -bottom-8 left-1/2 flex -translate-x-1/2 gap-2">
								{dishes.map((_, i) => (
									<button
										key={i}
										onClick={() => {
											setDirection(i > current ? 1 : -1);
											setCurrent(i);
										}}
										className={`h-2.5 rounded-full transition-all duration-300 ${
											i === current
												? "w-8 bg-blue-500"
												: "w-2.5 bg-blue-200 hover:bg-blue-300"
										}`}
									/>
								))}
							</div>
						</div>
					</ScrollReveal>

					<ScrollReveal delay={0.3}>
						<AnimatePresence mode="wait">
							<motion.div
								key={current}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -20 }}
								transition={{ duration: 0.4, ease: "easeOut" }}
							>
								{dish.place.type && (
									<div className="mb-4 flex flex-wrap gap-2">
										<span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-600">
											{dish.place.type}
										</span>
										{dish.place.avg_rating >= 4.5 && (
											<span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-600">
												{t.highlyRated}
											</span>
										)}
									</div>
								)}

								<h2 className="mb-2 text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
									{dish.place.name}
								</h2>

								<div className="mb-4 flex items-center gap-3">
									<div className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1">
										<RiStarFill className="text-amber-400" />
										<span className="text-sm font-semibold text-amber-700">
											{dish.place.avg_rating.toFixed(1)}
										</span>
									</div>
									<span className="text-sm text-gray-400">
										{dish.place.total_review.toLocaleString()}{" "}
										{t.reviews}
									</span>
								</div>
								<p className="mb-3 flex items-center gap-1.5 text-sm text-gray-500">
									<RiMapPinLine className="text-blue-400" />
									{dish.place.address}
								</p>
								<p className="mb-8 max-w-xl text-lg leading-relaxed text-gray-500">
									{dish.place.review ? (
										<span className="italic line-clamp-4">
											"{dish.place.review}"
										</span>
									) : (
										<>
											{t.discover}{" "}
											<span className="font-semibold text-gray-700">
												{dish.place.name}
											</span>{" "}
											{t.loved}{" "}
											{province
												? `${t.in} ${province}`
												: t.inVn}
											.
										</>
									)}
								</p>
								<button className="cursor-pointer rounded-full bg-blue-600 px-8 py-3.5 font-semibold text-white shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl">
									{t.explore}
								</button>
							</motion.div>
						</AnimatePresence>
					</ScrollReveal>
				</div>
			</div>
		</section>
	);
}
