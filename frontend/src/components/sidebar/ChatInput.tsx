import React, { useEffect, useRef, useState } from "react";
import {
	LayoutGrid,
	Mic,
	SendHorizontal,
	AudioLines,
	Languages,
	Image,
	ImageUp,
	FileText,
	X,
} from "lucide-react";

// ─── Danh sách công cụ trong dropdown ─────────────────────────────────────────
const TOOLS = [
	{
		id: "translate-menu",
		icon: Languages,
		label: "Translate Menu",
		description: "Dịch menu nhà hàng",
		color: "text-sky-500",
		bg: "bg-sky-50",
		hoverBg: "hover:bg-sky-50",
	},
	{
		id: "search-image",
		icon: Image,
		label: "Search Image",
		description: "Tìm món ăn qua ảnh",
		color: "text-amber-500",
		bg: "bg-amber-50",
		hoverBg: "hover:bg-amber-50",
	},
	{
		id: "send-image",
		icon: ImageUp,
		label: "Send Image",
		description: "Gửi ảnh trong chat",
		color: "text-violet-500",
		bg: "bg-violet-50",
		hoverBg: "hover:bg-violet-50",
	},
	{
		id: "review-summary",
		icon: FileText,
		label: "Review Summary",
		description: "Tóm tắt đánh giá",
		color: "text-emerald-500",
		bg: "bg-emerald-50",
		hoverBg: "hover:bg-emerald-50",
	},
] as const;

type ToolId = (typeof TOOLS)[number]["id"];

interface ChatInputProps {
	/** Callback khi gửi tin nhắn */
	onSubmit: (text: string) => void;
	/** Trạng thái bot đang suy nghĩ → disable input */
	isThinking: boolean;
	/** Trạng thái đang ghi âm */
	isListening: boolean;
	/** Toggle bật/tắt ghi âm */
	onVoiceToggle: () => void;
	/** Callback khi chọn công cụ */
	onToolSelect?: (toolId: ToolId) => void;
	/** Hiện rainbow border (khi bot thinking) */
	showRainbow?: boolean;
}

/**
 * ChatInput — Khung nhập liệu dạng Pill với:
 *  - Rainbow border xoay xung quanh (khi showRainbow = true)
 *  - Dropdown công cụ (Translate Menu / Search Image / Review Summary)
 *  - Textarea auto-resize tối đa 3 dòng
 *  - Nút Voice + Send
 */
export default function ChatInput({
	onSubmit,
	isThinking,
	isListening,
	onVoiceToggle,
	onToolSelect,
	showRainbow = false,
}: ChatInputProps) {
	const [text, setText] = useState("");
	const [showTools, setShowTools] = useState(false);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const toolsRef = useRef<HTMLDivElement>(null);

	// ─── Đóng dropdown khi click ngoài ────────────────────────────────────────
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (
				toolsRef.current &&
				!toolsRef.current.contains(e.target as Node)
			) {
				setShowTools(false);
			}
		};
		if (showTools) {
			document.addEventListener("mousedown", handleClickOutside);
		}
		return () =>
			document.removeEventListener("mousedown", handleClickOutside);
	}, [showTools]);

	// ─── Auto-resize textarea ──────────────────────────────────────────────────
	const autoResize = () => {
		const el = textareaRef.current;
		if (!el) return;
		el.style.height = "auto";
		el.style.height = `${Math.min(el.scrollHeight, 72)}px`;
	};

	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setText(e.target.value);
		autoResize();
	};

	// ─── Submit ────────────────────────────────────────────────────────────────
	const handleSubmit = () => {
		const trimmed = text.trim();
		if (!trimmed || isThinking) return;
		onSubmit(trimmed);
		setText("");
		if (textareaRef.current) textareaRef.current.style.height = "auto";
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSubmit();
		}
	};

	// ─── Tools dropdown ────────────────────────────────────────────────────────
	const handleToolClick = (toolId: ToolId) => {
		setShowTools(false);
		onToolSelect?.(toolId);
	};

	const hasText = text.trim().length > 0;

	return (
		<div className="px-4 pb-4 pt-2">
			{/* ── Wrapper với rainbow border ── */}
			<div className="relative">
				{/* Rainbow conic-gradient xoay — chỉ hiện khi showRainbow */}
				<div
					className={`absolute -inset-0.5 rounded-4xl transition-opacity duration-700 pointer-events-none overflow-hidden
						${showRainbow ? "opacity-100" : "opacity-0"}`}
				>
					{/* Vòng xoay gradient */}
					<div
						className="absolute -inset-2 animate-spin-slow"
						style={{
							background:
								"conic-gradient(from 0deg, #f97316, #ec4899, #a855f7, #3b82f6, #06b6d4, #f97316)",
						}}
					/>
					{/* Glow mờ bên ngoài */}
					<div
						className="absolute -inset-1.5 blur-md animate-rainbow-pulse opacity-60"
						style={{
							background:
								"conic-gradient(from 0deg, #f97316, #ec4899, #a855f7, #3b82f6, #06b6d4, #f97316)",
						}}
					/>
				</div>

				{/* Pill input — nằm trên gradient, inset 2px để lộ viền */}
				<div
					className="relative z-10 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm
						border border-gray-200/60 rounded-[1.75rem] p-1.5
						focus-within:border-gray-300 focus-within:bg-white
						focus-within:shadow-sm transition-all duration-300"
					style={{ margin: showRainbow ? "2px" : "0" }}
				>
					{/* ── Nút Tools (trái) w/ dropdown ──────────────────────── */}
					<div className="relative shrink-0" ref={toolsRef}>
						<button
							type="button"
							onClick={() => setShowTools((v) => !v)}
							className={`p-2.5 rounded-2xl transition-all duration-200 cursor-pointer
								${
									showTools
										? "text-orange-500 bg-orange-50"
										: "text-gray-400 hover:text-orange-500 hover:bg-orange-50"
								}`}
							title="Công cụ"
						>
							{showTools ? (
								<X size={18} strokeWidth={2} />
							) : (
								<LayoutGrid size={18} strokeWidth={1.8} />
							)}
						</button>

						{/* ── Dropdown menu công cụ ──────────────────────────── */}
						{showTools && (
							<div
								className="absolute bottom-full left-0 mb-2 w-52
									bg-white rounded-2xl shadow-xl border border-gray-100/80
									overflow-hidden 	z-50 animate-slide-up"
							>
								<p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 pt-3 pb-1.5">
									Công cụ
								</p>
								{TOOLS.map((tool) => (
									<button
										key={tool.id}
										type="button"
										onClick={() => handleToolClick(tool.id)}
										className={`w-full flex items-center gap-3 px-3 py-2.5
											transition-colors duration-150 cursor-pointer
											${tool.hoverBg}`}
									>
										<div
											className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${tool.bg}`}
										>
											<tool.icon
												size={16}
												strokeWidth={1.8}
												className={tool.color}
											/>
										</div>
										<div className="text-left">
											<p className="text-xs font-semibold text-gray-700 leading-tight">
												{tool.label}
											</p>
											<p className="text-[10px] text-gray-400 leading-tight mt-0.5">
												{tool.description}
											</p>
										</div>
									</button>
								))}
								<div className="h-2" />
							</div>
						)}
					</div>

					{/* ── Textarea auto-resize ──────────────────────────────── */}
					<textarea
						ref={textareaRef}
						value={text}
						onChange={handleChange}
						onKeyDown={handleKeyDown}
						disabled={isThinking}
						rows={1}
						placeholder={
							isThinking
								? "AI đang trả lời..."
								: "Hỏi về ẩm thực, địa điểm..."
						}
						className="grow resize-none bg-transparent outline-none
							text-gray-800 text-sm leading-relaxed
							py-2.5 px-1 max-h-18 overflow-y-auto
							placeholder:text-gray-400
							disabled:opacity-50 disabled:cursor-not-allowed"
					/>

					{/* ── Nút Voice ─────────────────────────────────────────── */}
					<button
						type="button"
						onClick={onVoiceToggle}
						disabled={isThinking}
						className={`shrink-0 p-2.5 rounded-2xl transition-all duration-200 cursor-pointer
							${
								isListening
									? "text-red-500 bg-red-50 mic-animation"
									: "text-gray-400 hover:text-emerald-500 hover:bg-emerald-50"
							}
							disabled:opacity-40 disabled:cursor-not-allowed`}
						title={isListening ? "Dừng ghi âm" : "Ghi âm giọng nói"}
					>
						{isListening ? (
							<Mic size={18} strokeWidth={2} />
						) : (
							<AudioLines size={18} strokeWidth={1.8} />
						)}
					</button>

					{/* ── Nút Send ──────────────────────────────────────────── */}
					<button
						type="button"
						onClick={handleSubmit}
						disabled={!hasText || isThinking}
						className={`shrink-0 p-2.5 rounded-full transition-all duration-300 cursor-pointer
							${
								hasText && !isThinking
									? "bg-linear-to-r from-sky-300 to-cyan-300 text-gray-600 shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
									: "bg-gray-100 text-gray-300 cursor-not-allowed"
							}`}
						title="Gửi tin nhắn"
					>
						<SendHorizontal size={16} strokeWidth={2} />
					</button>
				</div>
			</div>

			{/* ── Hint text ── */}
			<p className="text-[10px] text-gray-400 text-center mt-2 select-none">
				Enter để gửi · Shift + Enter để xuống dòng
			</p>
		</div>
	);
}
