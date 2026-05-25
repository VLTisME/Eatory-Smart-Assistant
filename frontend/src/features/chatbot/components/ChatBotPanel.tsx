import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { MenuResponse } from "../../../types/menuTranslation";
import type {
	PlaceSearchResponse,
	PlaceSearchItem,
} from "../../../types/placeSearch";
import MenuCard from "./MenuCard";
import { X, Loader2 } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { apiV1 } from "../../../config/api";
import { useLanguage } from "../../../hooks/useLanguage";

export interface Message {
	id: string;
	role: "user" | "bot";
	content: string;
	menuData?: MenuResponse;
	placeSearchData?: PlaceSearchResponse;
	imageUrl?: string;
	isImageLoading?: boolean;
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

function ChatImage({ src, isUser }: { src: string; isUser: boolean }) {
	const [lightbox, setLightbox] = useState(false);
	const [loaded, setLoaded] = useState(false);
	const { lang } = useLanguage();
	const zoomLabel = lang === "vi" ? "Nhấn để phóng to" : "Click to enlarge";

	return (
		<>
			<div
				className={`relative group cursor-pointer overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-lg ${
					isUser ? "max-w-65 ml-auto" : "max-w-70"
				}`}
				onClick={() => setLightbox(true)}
			>
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
				<div className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center">
					<span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
						{zoomLabel}
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

function PlaceSearchCard({
	item,
	onClick,
}: {
	item: PlaceSearchResponse["results"][0];
	onClick?: () => void;
}) {
	const [imageUrl, setImageUrl] = useState<string | null>(null);
	const [imageLoaded, setImageLoaded] = useState(false);

	useEffect(() => {
		let cancelled = false;
		const controller = new AbortController();

		async function loadImage() {
			try {
				const res = await fetch(
					apiV1(`/place-images/single?place_id=${encodeURIComponent(item.place_id)}`),
					{ signal: controller.signal },
				);
				if (!res.ok) return;
				const data = await res.json();
				if (!cancelled && data.file_path) {
					setImageUrl(data.file_path);
				}
			} catch {
				// Silently ignore — image is non-critical
			}
		}

		loadImage();
		return () => {
			cancelled = true;
			controller.abort();
		};
	}, [item.place_id]);

	return (
		<div
			onClick={onClick}
			className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm cursor-pointer hover:shadow-md hover:border-gray-200 active:scale-[0.98] transition-all duration-200"
		>
			<div className="aspect-4/3 w-full bg-gray-100 relative overflow-hidden">
				{!imageLoaded && (
					<div className="absolute inset-0 bg-linear-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
				)}
				{imageUrl && (
					<img
						src={imageUrl}
						alt={item.name || item.place_id}
						className={`h-full w-full object-cover transition-opacity duration-300 ${
							imageLoaded ? "opacity-100" : "opacity-0"
						}`}
						onLoad={() => setImageLoaded(true)}
					/>
				)}
				{!imageUrl && !imageLoaded && (
					<div className="absolute inset-0 flex items-center justify-center">
						<span className="text-3xl">🍜</span>
					</div>
				)}
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
	);
}

function PlaceSearchList({
	data,
	onPlaceClick,
}: {
	data: PlaceSearchResponse;
	onPlaceClick?: (item: PlaceSearchItem) => void;
}) {
	const results = data.results.slice(0, 5);

	return (
		<div className="grid gap-3 sm:grid-cols-2">
			{results.map((item: PlaceSearchItem) => (
				<PlaceSearchCard
					key={item.place_id}
					item={item}
					onClick={() => onPlaceClick?.(item)}
				/>
			))}
		</div>
	);
}

interface ChatBotPanelProps {
	messages: Message[];
	isThinking: boolean;
	onPlaceClick?: (item: PlaceSearchItem) => void;
}

function ChatBotPanel({
	messages,
	isThinking,
	onPlaceClick,
}: ChatBotPanelProps) {
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
					{msg.role === "bot" && msg.menuData ? (
						<div className="w-full max-w-full space-y-2">
							{msg.content && (
								<div className="bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-bl-sm p-3 shadow-sm leading-relaxed text-sm inline-block w-full">
									<MarkdownRenderer content={msg.content} />
								</div>
							)}
							<MenuCard data={msg.menuData} />
						</div>
					) : msg.role === "bot" && msg.placeSearchData ? (
						<div className="w-full max-w-full space-y-2">
							{msg.content && (
								<div className="rounded-2xl rounded-bl-sm border border-gray-100 bg-white p-3 text-sm leading-relaxed text-gray-800 shadow-sm inline-block w-full">
									<MarkdownRenderer content={msg.content} />
								</div>
							)}
							<PlaceSearchList
								data={msg.placeSearchData}
								onPlaceClick={onPlaceClick}
							/>
						</div>
					) : (
						<div
							className={`flex flex-col gap-2 max-w-[85%] ${msg.role === "user" ? "items-end" : "items-start"}`}
						>
							{msg.content && (
								<div
									className={`p-3 rounded-2xl shadow-sm leading-relaxed text-sm ${
										msg.role === "user"
											? "bg-blue-600 text-white rounded-br-sm"
											: "bg-white border border-gray-100 text-gray-800 rounded-bl-sm w-full"
									}`}
								>
									{msg.role === "user" ? (
										msg.content
									) : (
										<MarkdownRenderer
											content={msg.content}
										/>
									)}
								</div>
							)}
							{msg.imageUrl && (
								<ChatImage
									src={msg.imageUrl}
									isUser={msg.role === "user"}
								/>
							)}
							{msg.isImageLoading && (
								<div className="flex items-center justify-center p-4 bg-gray-100/50 rounded-2xl border border-gray-200/60 w-32 h-24 ml-auto">
									<Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
								</div>
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
