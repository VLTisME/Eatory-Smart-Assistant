import { useState, useEffect, useId, useCallback } from "react";
import { useMap } from "react-map-gl/maplibre";
import {
	ChevronLeft,
	ChevronRight,
	Road,
	MapPin,
	History,
	Loader2,
	Box,
	CirclePlus,
	X,
	NotebookText,
} from "lucide-react";
import { type SearchMarker } from "../map/GoogleMapView";
import {
	checkPlaceExists,
	fetchRandomImage,
	fetchBatchImages,
	fetchReviewSamples,
	type PlaceDetailItem,
	type PlaceImageItem,
	type ReviewSampleItem,
} from "../../api/placeAPI";
import { AnimatePresence, motion } from "framer-motion";
import DirectionPanel from "./DirectionPanel";
import type { RouteInfo } from "../../api/directionsAPI";

interface PlaceSidebarProps {
	place: SearchMarker | null;
	onRouteResult?: (route: RouteInfo | null) => void;
}

const StarRating = ({ rating }: { rating: number }) => {
	const baseId = useId().replace(/:/g, "");

	return (
		<div className="flex items-center space-x-1">
			{[1, 2, 3, 4, 5].map((index) => {
				const fillPercent = Math.max(
					0,
					Math.min(100, (rating - index + 1) * 100),
				);
				const id = `star-grad-${baseId}-${index}`;
				return (
					<svg
						key={index}
						viewBox="0 0 24 24"
						className="w-5 h-5 drop-shadow-sm"
					>
						<defs>
							<linearGradient
								id={id}
								x1="0%"
								y1="0%"
								x2="100%"
								y2="0%"
							>
								<stop
									offset={`${fillPercent}%`}
									stopColor="#FBBF24"
								/>
								<stop
									offset={`${fillPercent}%`}
									stopColor="#E5E7EB"
								/>
							</linearGradient>
						</defs>
						<path
							fill={`url(#${id})`}
							d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
						/>
					</svg>
				);
			})}
		</div>
	);
};

export default function PlaceSidebar({
	place,
	onRouteResult,
}: PlaceSidebarProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [activeTab, setActiveTab] = useState("overview");
	const { mainMap } = useMap();
	const [prevPlace, setPrevPlace] = useState(place);

	const [placeDetail, setPlaceDetail] = useState<PlaceDetailItem | null>(
		null,
	);
	const [placeImage, setPlaceImage] = useState<string | null>(null);
	const [isCheckingPlace, setIsCheckingPlace] = useState(false);
	const [placeExistsInDb, setPlaceExistsInDb] = useState(false);

	const [menuImages, setMenuImages] = useState<PlaceImageItem[]>([]);
	const [reviews, setReviews] = useState<ReviewSampleItem[]>([]);
	const [selectedImage, setSelectedImage] = useState<string | null>(null);

	// Direction panel state
	const [showDirections, setShowDirections] = useState(false);
	const [userLocation, setUserLocation] = useState<{
		lat: number;
		lng: number;
	} | null>(null);
	const [geoRequested, setGeoRequested] = useState(false);

	const SIDEBAR_WIDTH = 400;

	if (place !== prevPlace) {
		setPrevPlace(place);
		if (place) {
			// Reset states
			setPlaceDetail(null);
			setPlaceImage(null);
			setPlaceExistsInDb(false);
			setIsCheckingPlace(true);
			setShowDirections(false);
		}
	}

	useEffect(() => {
		if (!isCheckingPlace || !place) return;

		let cancelled = false;
		const controller = new AbortController();

		async function checkAndFetch() {
			try {
				const checkRes = await checkPlaceExists(
					place!.name,
					controller.signal,
				);

				if (cancelled) return;

				if (checkRes.exists && checkRes.data) {
					setPlaceExistsInDb(true);
					setPlaceDetail(checkRes.data);
					setIsOpen(true);
					try {
						const [imgRes, batchRes, reviewRes] = await Promise.all(
							[
								fetchRandomImage(
									checkRes.data.place_id,
									controller.signal,
								).catch(() => null),
								fetchBatchImages(
									checkRes.data.place_id,
									4,
									controller.signal,
								).catch(() => null),
								fetchReviewSamples(
									checkRes.data.place_id,
									3,
									controller.signal,
								).catch(() => null),
							],
						);
						if (!cancelled) {
							if (imgRes) setPlaceImage(imgRes.file_path);
							if (batchRes) setMenuImages(batchRes.images);
							if (reviewRes) setReviews(reviewRes.reviews);
						}
					} catch {
						console.warn("Failed to fetch place images or reviews");
					}
				} else {
					setPlaceExistsInDb(false);
					setPlaceDetail(null);
					setIsOpen(true);
				}
			} catch (err) {
				if (!cancelled) {
					console.error("Failed to check place:", err);
					setPlaceExistsInDb(false);
					setIsOpen(true);
				}
			} finally {
				if (!cancelled) {
					setIsCheckingPlace(false);
				}
			}
		}

		checkAndFetch();

		return () => {
			cancelled = true;
			controller.abort();
		};
	}, [isCheckingPlace, place]);

	const toggleSidebar = () => {
		const nextIsOpen = !isOpen;
		setIsOpen(nextIsOpen);
		if (mainMap) {
			mainMap.easeTo({
				padding: { left: nextIsOpen ? SIDEBAR_WIDTH : 0 },
				duration: 500,
				essential: true,
			});
		}
	};

	const handleDirectionClick = useCallback(() => {
		if (userLocation) {
			setShowDirections(true);
			return;
		}
		if (!navigator.geolocation) {
			alert("Trình duyệt không hỗ trợ định vị.");
			return;
		}

		setGeoRequested(true);
		navigator.geolocation.getCurrentPosition(
			(position) => {
				const { latitude, longitude } = position.coords;
				setUserLocation({ lat: latitude, lng: longitude });
				setShowDirections(true);
				setGeoRequested(false);
			},
			(err) => {
				console.error("Geolocation error:", err);
				setGeoRequested(false);
				setShowDirections(true);
			},
			{ enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
		);
	}, [userLocation]);

	const handleDirectionClose = useCallback(() => {
		setShowDirections(false);
		if (onRouteResult) onRouteResult(null);
	}, [onRouteResult]);

	const handleRouteResult = useCallback(
		(route: RouteInfo | null) => {
			if (onRouteResult) onRouteResult(route);
		},
		[onRouteResult],
	);

	if (!place) return null;

	const rating = placeDetail?.avg_rating ?? 0;
	const reviewCount = placeDetail?.total_review ?? 0;
	const displayName = placeDetail?.name ?? place.name;
	const displayAddress = placeDetail?.address ?? place.address;
	const displayType = placeDetail?.type ?? "";

	return (
		<div
			className={`pointer-events-auto absolute top-0 left-0 h-full w-115 bg-slate-50/95 backdrop-blur-md shadow-2xl transition-transform duration-500 ease-in-out z-40 flex flex-col border-r border-slate-200/60 ${
				isOpen ? "translate-x-0" : "-translate-x-full"
			}`}
		>
			<button
				onClick={toggleSidebar}
				className="absolute top-1/2 -right-12 w-12 h-20 bg-white shadow-[6px_0_10px_-3px_rgba(0,0,0,0.15)] rounded-r-2xl flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all z-50 border border-l-0 border-slate-200 cursor-pointer"
			>
				{isOpen ? (
					<ChevronLeft size={28} />
				) : (
					<ChevronRight size={28} />
				)}
			</button>
			<div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
				{/* Cover Image */}
				<div className="relative h-64 w-full shrink-0 shadow-inner">
					{isCheckingPlace ? (
						<div className="w-full h-full bg-linear-to-br from-slate-200 to-slate-300 flex items-center justify-center">
							<Loader2
								size={32}
								className="text-slate-400 animate-spin"
							/>
						</div>
					) : placeImage ? (
						<img
							src={placeImage}
							alt={displayName}
							className="w-full h-full object-cover"
						/>
					) : (
						<div className="w-full h-full bg-linear-to-br from-blue-200 via-sky-200 to-blue-300 flex items-center justify-center">
							<span className="text-6xl">📍</span>
						</div>
					)}
					<div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent"></div>
					{displayType && (
						<div className="absolute top-4 left-4 z-10 rounded-full bg-white/90 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
							{displayType}
						</div>
					)}
				</div>
				<div className="px-6 pt-5 pb-4 bg-white relative -mt-6 rounded-t-2xl shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
					<h2 className="text-[22px] font-extrabold text-slate-900 mb-2 leading-tight tracking-tight">
						{displayName}
					</h2>
					<div className="flex items-start text-slate-600 text-[18px] mb-1">
						<Box
							size={20}
							className="mr-1.5 shrink-0 text-red-500 mt-0.5"
						/>

						{displayType && (
							<span className="leading-relaxed line-clamp-2">
								{displayType.charAt(0).toUpperCase() +
									displayType.slice(1)}
							</span>
						)}
					</div>
					{placeExistsInDb && rating > 0 ? (
						<div className="flex items-center space-x-2.5 mb-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
							<span className="font-black text-[14px] text-slate-900">
								{rating.toFixed(1)}
							</span>
							<StarRating rating={rating} />
							<span className="text-sm font-medium text-slate-500">
								({reviewCount.toLocaleString()})
							</span>
						</div>
					) : (
						<div className="flex items-center space-x-2.5 mb-4 bg-blue-50/50 p-3 rounded-2xl border border-blue-100/50">
							<span className="text-xs font-medium text-blue-500">
								{placeExistsInDb
									? "Chưa có đánh giá"
									: "Chưa có trong hệ thống"}
							</span>
						</div>
					)}
					<div className="flex space-x-3 mb-2">
						<button
							onClick={handleDirectionClick}
							disabled={geoRequested}
							className={`cursor-pointer flex-1 bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5 text-white py-3 rounded-3xl font-semibold flex items-center justify-center transition-all duration-400 shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30 active:scale-95 ${
								geoRequested ? "opacity-70 cursor-wait" : ""
							}`}
						>
							{geoRequested ? (
								<Loader2
									size={18}
									className="mr-2 animate-spin"
								/>
							) : (
								<Road
									size={18}
									strokeWidth={2}
									className="mr-2"
								/>
							)}
							{geoRequested ? "Đang định vị..." : "Directions"}
						</button>
						<button
							onClick={() => {
								const detailName =
									placeDetail?.name || place?.name;
								const event = new CustomEvent("open-chatbot", {
									detail: {
										action: "review-summary",
										placeId: placeDetail?.place_id,
										name: detailName,
									},
								});
								window.dispatchEvent(event);
							}}
							className="cursor-pointer flex-1 bg-orange-100 hover:bg-orange-200 hover:-translate-y-0.5 text-orange-700 py-3 rounded-3xl font-semibold flex items-center justify-center transition-all duration-400 active:scale-95"
						>
							<NotebookText
								size={18}
								strokeWidth={2}
								className="mr-2"
							/>
							Review Summary
						</button>
					</div>
				</div>
				<AnimatePresence>
					{showDirections && (
						<motion.div
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: "auto" }}
							exit={{ opacity: 0, height: 0 }}
							transition={{
								type: "spring",
								damping: 25,
								stiffness: 300,
							}}
							className="px-3 overflow-hidden"
						>
							<div className="py-3">
								<DirectionPanel
									userLat={userLocation?.lat ?? null}
									userLng={userLocation?.lng ?? null}
									destLat={place.lat}
									destLng={place.lng}
									destName={displayName}
									onClose={handleDirectionClose}
									onRouteResult={handleRouteResult}
								/>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
				<div className="bg-white border-b border-slate-200 px-4 sticky top-0 z-10">
					<div className="flex justify-between">
						{["overview", "menu", "reviews"].map((tab) => (
							<button
								key={tab}
								onClick={() => setActiveTab(tab)}
								className={`cursor-pointer rounded-2xl flex-1 py-4 text-sm font-bold capitalize relative transition-colors ${
									activeTab === tab
										? "text-blue-600"
										: "text-slate-500 hover:text-slate-800 hover:bg-gray-200 transition-all duration-300"
								}`}
							>
								{tab === "overview"
									? "Tổng quan"
									: tab === "menu"
										? "Góc View"
										: "Đánh giá"}
								{activeTab === tab && (
									<div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-600 rounded-t-full" />
								)}
							</button>
						))}
					</div>
				</div>
				<div className="p-3 text-slate-600 text-sm bg-slate-50/50 min-h-75">
					{activeTab === "overview" && (
						<div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
							<div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100/50 space-y-4">
								<h3 className="font-bold text-slate-800 text-base">
									Thông tin chi tiết
								</h3>
								<div className="flex items-center text-emerald-600 font-medium">
									<History size={20} strokeWidth={2} />
									<div className="text-slate-400 mx-2">
										<span className="text-emerald-600">
											Đang mở cửa{" "}
										</span>
										• Đóng cửa lúc 23:00
									</div>{" "}
								</div>
								<div className="flex items-center font-medium text-emerald-600">
									<MapPin size={20} strokeWidth={2} />
									<div className="text-slate-600 mx-2">
										{displayAddress}
									</div>
								</div>
								{placeExistsInDb && placeDetail && (
									<div className="flex items-center gap-2 text-sm text-slate-500">
										<CirclePlus
											size={20}
											strokeWidth={2}
											className="text-emerald-600"
										/>
										<span className="font-semibold text-slate-700">
											Tọa độ:
										</span>
										{placeDetail.location.lat.toFixed(4)},{" "}
										{placeDetail.location.lng.toFixed(4)}
									</div>
								)}
							</div>
						</div>
					)}
					{activeTab === "menu" && (
						<div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
							<div className="grid grid-cols-2 gap-4">
								{placeExistsInDb && menuImages.length > 0 ? (
									menuImages.map((img, idx) => (
										<div
											key={img.image_id || idx}
											className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
											onClick={() =>
												setSelectedImage(img.file_path)
											}
										>
											<div className="h-32 bg-slate-200 overflow-hidden">
												<img
													src={img.file_path}
													alt="Place image"
													className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
												/>
											</div>
										</div>
									))
								) : (
									<div className="col-span-2 text-center text-slate-500 py-4">
										Chưa có hình ảnh cho góc view này.
									</div>
								)}
							</div>
						</div>
					)}
					{activeTab === "reviews" && (
						<div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
							<h3 className="font-bold text-slate-800 text-base px-1">
								Đánh giá từ người dùng
							</h3>
							{placeExistsInDb && reviews.length > 0 ? (
								reviews.map((rev, idx) => (
									<div
										key={rev.id || idx}
										className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100"
									>
										<div className="flex items-center mb-3">
											<div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 font-bold mr-3 shadow-inner">
												U{idx + 1}
											</div>
											<div>
												<p className="text-sm font-bold text-slate-800">
													Người dùng {idx + 1}
												</p>
												<div className="flex mt-0.5">
													<StarRating
														rating={rev.rating || 5}
													/>
												</div>
											</div>
										</div>
										<p className="text-sm text-slate-600 leading-relaxed">
											{rev.text}
										</p>
									</div>
								))
							) : (
								<div className="text-center text-slate-500 py-4">
									Chưa có đánh giá nào cho địa điểm này.
								</div>
							)}
						</div>
					)}
				</div>
			</div>
			<AnimatePresence>
				{selectedImage && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={() => setSelectedImage(null)}
						className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 cursor-pointer"
					>
						<motion.img
							initial={{ scale: 0.9, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.9, opacity: 0 }}
							transition={{
								type: "spring",
								damping: 25,
								stiffness: 300,
							}}
							src={selectedImage}
							alt="Enlarged view"
							className="max-h-full max-w-full rounded-2xl shadow-2xl object-contain cursor-default"
							onClick={(e: React.MouseEvent) => e.stopPropagation()}
						/>
						<button
							onClick={() => setSelectedImage(null)}
							className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/80 rounded-full p-2 transition-colors cursor-pointer"
						>
							<X size={24} />
						</button>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
