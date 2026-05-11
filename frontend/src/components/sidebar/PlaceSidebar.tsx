import { useState, useId } from "react";
import { useMap } from "react-map-gl/maplibre";
import {
	ChevronLeft,
	ChevronRight,
	Navigation,
	MessageSquare,
	MapPin,
	History,
} from "lucide-react";
import { type SearchMarker } from "../map/GoogleMapView";

interface PlaceSidebarProps {
	place: SearchMarker | null;
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

export default function PlaceSidebar({ place }: PlaceSidebarProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [activeTab, setActiveTab] = useState("overview");
	const { mainMap } = useMap();
	const [prevPlace, setPrevPlace] = useState(place);

	const SIDEBAR_WIDTH = 400;

	if (place !== prevPlace) {
		setPrevPlace(place);
		if (place) {
			setIsOpen(true);
		}
	}

	const toggleSidebar = () => {
		const nextIsOpen = !isOpen;
		setIsOpen(nextIsOpen);
		if (mainMap) {
			// Dynamically offset map center to avoid marker overlapping with sidebar
			mainMap.easeTo({
				padding: { left: nextIsOpen ? SIDEBAR_WIDTH : 0 },
				duration: 500,
				essential: true,
			});
		}
	};

	if (!place) return null;

	const rating = 4.3; // Mock rating
	const reviewCount = "1,035";

	return (
		<div
			className={`pointer-events-auto absolute top-0 left-0 h-full w-115 bg-slate-50/95 backdrop-blur-md shadow-2xl transition-transform duration-500 ease-in-out z-40 flex flex-col border-r border-slate-200/60 ${
				isOpen ? "translate-x-0" : "-translate-x-full"
			}`}
		>
			{/* Toggle Button */}
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

			{/* Sidebar Content */}
			<div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
				{/* Cover Image */}
				<div className="relative h-64 w-full shrink-0 shadow-inner">
					<img
						src="https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1000&auto=format&fit=crop"
						alt={place.name}
						className="w-full h-full object-cover"
					/>
					<div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent"></div>
				</div>

				{/* Header Info */}
				<div className="px-6 pt-5 pb-4 bg-white relative -mt-6 rounded-t-2xl shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
					<h2 className="text-[22px] font-extrabold text-slate-900 mb-2 leading-tight tracking-tight">
						{place.name}
					</h2>
					<div className="flex items-start text-slate-600 text-sm mb-2">
						<MapPin
							size={18}
							className="mr-1.5 shrink-0 text-red-500 mt-0.5"
						/>
						<span className="leading-relaxed line-clamp-2">
							{place.address}
						</span>
					</div>

					{/* Rating */}
					<div className="flex items-center space-x-2.5 mb-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
						<span className="font-black text-[14px] text-slate-900">
							{rating}
						</span>
						<StarRating rating={rating} />
						<span className="text-sm font-medium text-slate-500">
							({reviewCount})
						</span>
					</div>

					{/* Action Buttons */}
					<div className="flex space-x-3 mb-2">
						<button className="cursor-pointer flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-3xl font-semibold flex items-center justify-center transition-all shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30 active:scale-95">
							<Navigation size={18} className="mr-2" />
							Đường đi
						</button>
						<button className="cursor-pointer flex-1 bg-orange-100 hover:bg-orange-200 text-orange-700 py-3 rounded-3xl font-semibold flex items-center justify-center transition-all active:scale-95">
							<MessageSquare size={18} className="mr-2" />
							Review Summary
						</button>
					</div>
				</div>

				{/* Navigation Tabs */}
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
										? "Thực đơn"
										: "Đánh giá"}
								{activeTab === tab && (
									<div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-600 rounded-t-full" />
								)}
							</button>
						))}
					</div>
				</div>

				{/* Tab Content */}
				<div className="p-6 text-slate-600 text-sm bg-slate-50/50 min-h-75">
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
										31 Tô Vĩnh Diện, Thủ Đức, Hồ Chí Minh,
										Việt Nam
									</div>
								</div>
							</div>
						</div>
					)}
					{activeTab === "menu" && (
						<div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
							<h3 className="font-bold text-slate-800 text-base px-1">
								Thực đơn nổi bật
							</h3>
							<div className="grid grid-cols-2 gap-4">
								{[1, 2, 3, 4].map((i) => (
									<div
										key={i}
										className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
									>
										<div className="h-28 bg-slate-200 overflow-hidden">
											<img
												src={`https://images.unsplash.com/photo-1550461716-dbf266b2a8a7?q=80&w=300&auto=format&fit=crop&sig=${i}`}
												alt="Food"
												className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
											/>
										</div>
										<div className="p-3">
											<div className="text-sm font-bold text-slate-800 truncate mb-1">
												Món ăn đặc sắc {i}
											</div>
											<div className="text-xs font-medium text-blue-600">
												45.000 ₫
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					)}
					{activeTab === "reviews" && (
						<div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
							<h3 className="font-bold text-slate-800 text-base px-1">
								Đánh giá từ người dùng
							</h3>
							{[1, 2, 3].map((i) => (
								<div
									key={i}
									className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100"
								>
									<div className="flex items-center mb-3">
										<div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 font-bold mr-3 shadow-inner">
											U{i}
										</div>
										<div>
											<p className="text-sm font-bold text-slate-800">
												Người dùng {i}
											</p>
											<div className="flex mt-0.5">
												<StarRating rating={5} />
											</div>
										</div>
									</div>
									<p className="text-sm text-slate-600 leading-relaxed">
										Địa điểm rất tuyệt vời, không gian
										thoáng mát và phục vụ tận tình. Chắc
										chắn sẽ quay lại vào lần sau.
									</p>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
