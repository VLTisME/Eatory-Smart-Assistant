import { useEffect, useRef } from "react";
import type { MenuResponse } from "../../types/menuTranslation";
import type { PlaceSearchResponse } from "../../types/placeSearch";
import MenuCard from "./MenuCard";

export interface Message {
	id: string;
	role: "user" | "bot";
	content: string;
	/** Nếu bot trả về structured menu → render MenuCard */
	menuData?: MenuResponse;
	/** Nếu bot trả về structured place search → render cards */
	placeSearchData?: PlaceSearchResponse;
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
					<div className="aspect-[4/3] w-full bg-gray-100">
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
					} animate-slide-up`}
				>
					{/* ── Bot message with menuData → render MenuCard ── */}
					{msg.role === "bot" && msg.menuData ? (
						<div className="w-full max-w-full animate-fade-in-up">
							{/* Optional text above the card */}
							{msg.content && (
								<div className="bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-bl-sm p-3 shadow-sm leading-relaxed mb-2 text-sm">
									{msg.content}
								</div>
							)}
							<MenuCard data={msg.menuData} />
						</div>
					) : msg.role === "bot" && msg.placeSearchData ? (
						<div className="w-full max-w-full animate-fade-in-up space-y-2">
							{msg.content && (
								<div className="rounded-2xl rounded-bl-sm border border-gray-100 bg-white p-3 text-sm leading-relaxed text-gray-800 shadow-sm">
									{msg.content}
								</div>
							)}
							<PlaceSearchList data={msg.placeSearchData} />
						</div>
					) : (
						/* ── Regular text message ── */
						<div
							className={`max-w-[85%] p-3 rounded-2xl shadow-sm leading-relaxed text-sm ${
								msg.role === "user"
									? "bg-blue-600 text-white rounded-br-sm"
									: "bg-white border border-gray-100 text-gray-800 rounded-bl-sm"
							}`}
						>
							{msg.content}
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
