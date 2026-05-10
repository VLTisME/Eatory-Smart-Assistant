import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { MenuResponse } from "../../types/menuTranslation";
import type { PlaceSearchResponse } from "../../types/placeSearch";
import MenuCard from "./MenuCard";
import { X } from "lucide-react";

export interface Message {
	id: string;
	role: "user" | "bot";
	content: string;
	/** Nếu bot trả về structured menu → render MenuCard */
	menuData?: MenuResponse;
	/** Nếu bot trả về structured place search → render cards */
	placeSearchData?: PlaceSearchResponse;
	/** URL ảnh đã upload lên ImageKit */
	imageUrl?: string;
}

/* ── Image Lightbox ── */
function ImageLightbox({
	src,
	alt,
	onClose,
}: {
	src: string;
	alt: string;
	onClose: () => void;
}) {
	useEffect(() => {
		const handleEsc = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", handleEsc);
		return () => document.removeEventListener("keydown", handleEsc);
	}, [onClose]);

	return createPortal(
		<div
			className="fixed inset-0 z-9999 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in cursor-zoom-out"
			onClick={onClose}
		>
			<button
				onClick={onClose}
				className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer z-10"
			>
				<X size={24} />
			</button>
			<img
				src={src}
				alt={alt}
				className="max-w-[90vw] max-h-[85vh] rounded-2xl shadow-2xl object-contain animate-scale-in"
				onClick={(e) => e.stopPropagation()}
			/>
		</div>,
		document.body,
	);
}

/* ── Chat Image Bubble — hiển thị ảnh đẹp trong khung chat ── */
function ChatImage({ src, isUser }: { src: string; isUser: boolean }) {
	const [lightbox, setLightbox] = useState(false);
	const [loaded, setLoaded] = useState(false);

	return (
		<>
			<div
				className={`relative group cursor-pointer overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-lg ${
					isUser ? "max-w-65 ml-auto" : "max-w-70"
				}`}
				onClick={() => setLightbox(true)}
			>
				{/* Skeleton shimmer while loading */}
				{!loaded && (
					<div className="w-full aspect-4/3 rounded-2xl bg-linear-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
				)}
				<img
					src={src}
					alt="Uploaded"
					className={`w-full rounded-2xl object-cover transition-all duration-500 group-hover:scale-[1.02] ${
						loaded ? "opacity-100" : "opacity-0 absolute inset-0"
					}`}
					style={{ maxHeight: "240px" }}
					onLoad={() => setLoaded(true)}
				/>
				{/* Hover overlay */}
				<div className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center">
					<span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
						Nhấn để phóng to
					</span>
				</div>
			</div>
			{lightbox && (
				<ImageLightbox
					src={src}
					alt="Uploaded"
					onClose={() => setLightbox(false)}
				/>
			)}
		</>
	);
}

function PlaceSearchList({ data }: { data: PlaceSearchResponse }) {
	const results = data.results.slice(0, 5);

	return (
		<div className="grid gap-3 sm:grid-cols-2">
			{results.map((item) => (
				<div
					key={item.place_id}
					className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
				>
					<div className="aspect-4/3 w-full bg-gray-100">
						{item.top_image ? (
							<img
								src={item.top_image}
								alt={item.name || item.place_id}
								className="h-full w-full object-cover"
							/>
						) : null}
					</div>
					<div className="space-y-1 p-3">
						<div className="flex items-start justify-between gap-3">
							<h4 className="line-clamp-2 text-sm font-semibold text-gray-900">
								{item.name || item.place_id}
							</h4>
							<span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
								{Math.round(item.score * 100)}%
							</span>
						</div>
						{item.address ? (
							<p className="line-clamp-2 text-xs leading-relaxed text-gray-500">
								{item.address}
							</p>
						) : null}
					</div>
				</div>
			))}
		</div>
	);
}

interface ChatBotPanelProps {
	messages: Message[];
	isThinking: boolean;
}

function ChatBotPanel({ messages, isThinking }: ChatBotPanelProps) {
	const endRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		endRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, isThinking]);

	return (
		<div className="space-y-4 flex flex-col min-h-full justify-start">
			{messages.map((msg) => (
				<div
					key={msg.id}
					className={`flex ${
						msg.role === "user" ? "justify-end" : "justify-start"
					} animate-fade-in-up`}
				>
					{/* ── Bot message with menuData → render MenuCard ── */}
					{msg.role === "bot" && msg.menuData ? (
						<div className="w-full max-w-full space-y-2">
							{/* Optional text above the card */}
							{msg.content && (
								<div className="bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-bl-sm p-3 shadow-sm leading-relaxed text-sm inline-block">
									{msg.content}
								</div>
							)}
							<MenuCard data={msg.menuData} />
						</div>
					) : msg.role === "bot" && msg.placeSearchData ? (
						<div className="w-full max-w-full space-y-2">
							{msg.content && (
								<div className="rounded-2xl rounded-bl-sm border border-gray-100 bg-white p-3 text-sm leading-relaxed text-gray-800 shadow-sm inline-block">
									{msg.content}
								</div>
							)}
							<PlaceSearchList data={msg.placeSearchData} />
						</div>
					) : (
						/* ── Regular text message & separated image ── */
						<div
							className={`flex flex-col gap-2 max-w-[85%] ${msg.role === "user" ? "items-end" : "items-start"}`}
						>
							{msg.content && (
								<div
									className={`p-3 rounded-2xl shadow-sm leading-relaxed text-sm ${
										msg.role === "user"
											? "bg-blue-600 text-white rounded-br-sm"
											: "bg-white border border-gray-100 text-gray-800 rounded-bl-sm"
									}`}
								>
									{msg.content}
								</div>
							)}
							{/* ── Image display — outside the text bubble ── */}
							{msg.imageUrl && (
								<ChatImage
									src={msg.imageUrl}
									isUser={msg.role === "user"}
								/>
							)}
						</div>
					)}
				</div>
			))}

			{isThinking && (
				<div className="flex justify-start animate-slide-up">
					<div className="bg-white border border-gray-100 py-4 px-5 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-1.5">
						<span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
						<span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
						<span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
					</div>
				</div>
			)}

			<div ref={endRef} />
		</div>
	);
}

export default ChatBotPanel;
