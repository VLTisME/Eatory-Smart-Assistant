import React, { useEffect, useRef, useState } from "react";
import {
	LayoutGrid,
	Mic,
	SendHorizontal,
	AudioLines,
	Languages,
	Image,
	X,
} from "lucide-react";
import { getOppositeLanguage, useLanguage } from "../../../hooks/useLanguage";

// ─── Danh sách công cụ trong dropdown ─────────────────────────────────────────
const TOOLS = [
	{
		id: "translate-menu",
		icon: Languages,
		label: { vi: "Dịch menu", en: "Translate Menu" },
		description: { vi: "Dịch menu nhà hàng", en: "Translate restaurant menu" },
		color: "text-sky-500",
		bg: "bg-sky-50",
		hoverBg: "hover:bg-sky-50",
	},
	{
		id: "search-image",
		icon: Image,
		label: { vi: "Tìm bằng ảnh", en: "Search Image" },
		description: { vi: "Tìm món ăn qua ảnh", en: "Find places by image" },
		color: "text-amber-500",
		bg: "bg-amber-50",
		hoverBg: "hover:bg-amber-50",
	},
] as const;

type ToolId = (typeof TOOLS)[number]["id"];

interface ChatInputProps {
	onSubmit: (text: string) => void;
	isThinking: boolean;
	isListening: boolean;
	onVoiceToggle: () => void;
	onToolSelect?: (toolId: ToolId) => void;
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
	const { lang } = useLanguage();
	const menuTargetLabel =
		getOppositeLanguage(lang) === "vi" ? "Vietnamese" : "English";
	const menuDescription =
		lang === "vi"
			? `Dịch menu sang tiếng ${menuTargetLabel === "English" ? "Anh" : "Việt"}`
			: `Translate restaurant menu into ${menuTargetLabel}`;
	const uiText =
		lang === "vi"
			? {
					tools: "Công cụ",
					thinking: "AI đang trả lời...",
					placeholder: "Hỏi về ẩm thực, địa điểm...",
					stopVoice: "Dừng ghi âm",
					startVoice: "Ghi âm giọng nói",
					send: "Gửi tin nhắn",
					shortcut: "Enter để gửi · Shift + Enter để xuống dòng",
				}
			: {
					tools: "Tools",
					thinking: "AI is replying...",
					placeholder: "Ask about food or places...",
					stopVoice: "Stop recording",
					startVoice: "Voice input",
					send: "Send message",
					shortcut: "Enter to send · Shift + Enter for a new line",
				};

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

	const handleToolClick = (toolId: ToolId) => {
		setShowTools(false);
		onToolSelect?.(toolId);
	};

	const hasText = text.trim().length > 0;

	return (
		<div className="px-4 pb-4 pt-2">
			<div className="relative">
				<div
					className={`absolute -inset-0.5 rounded-4xl transition-opacity duration-700 pointer-events-none overflow-hidden
						${showRainbow ? "opacity-100" : "opacity-0"}`}
				>
					<div
						className="absolute -inset-2 animate-spin-slow"
						style={{
							background:
								"conic-gradient(from 0deg, #f97316, #ec4899, #a855f7, #3b82f6, #06b6d4, #f97316)",
						}}
					/>
					<div
						className="absolute -inset-1.5 blur-md animate-rainbow-pulse opacity-60"
						style={{
							background:
								"conic-gradient(from 0deg, #f97316, #ec4899, #a855f7, #3b82f6, #06b6d4, #f97316)",
						}}
					/>
				</div>
				<div
					className="relative z-10 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm
						border border-gray-200/60 rounded-[1.75rem] p-1.5
						focus-within:border-gray-300 focus-within:bg-white
						focus-within:shadow-sm transition-all duration-300"
					style={{ margin: showRainbow ? "2px" : "0" }}
				>
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
							title={uiText.tools}
						>
							{showTools ? (
								<X size={18} strokeWidth={2} />
							) : (
								<LayoutGrid size={18} strokeWidth={1.8} />
							)}
						</button>

						{showTools && (
							<div
								className="absolute bottom-full left-0 mb-2 w-52
									bg-white rounded-2xl shadow-xl border border-gray-100/80
									overflow-hidden 	z-50 animate-slide-up"
							>
								<p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 pt-3 pb-1.5">
									{uiText.tools}
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
												{tool.label[lang]}
											</p>
											<p className="text-[10px] text-gray-400 leading-tight mt-0.5">
												{tool.id === "translate-menu"
													? menuDescription
													: tool.description[lang]}
											</p>
										</div>
									</button>
								))}
								<div className="h-2" />
							</div>
						)}
					</div>
					<textarea
						ref={textareaRef}
						value={text}
						onChange={handleChange}
						onKeyDown={handleKeyDown}
						disabled={isThinking}
						rows={1}
						placeholder={
							isThinking
								? uiText.thinking
								: uiText.placeholder
						}
						className="grow resize-none bg-transparent outline-none
							text-gray-800 text-sm leading-relaxed
							py-2.5 px-1 max-h-18 overflow-y-auto
							placeholder:text-gray-400
							disabled:opacity-50 disabled:cursor-not-allowed"
					/>
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
						title={isListening ? uiText.stopVoice : uiText.startVoice}
					>
						{isListening ? (
							<Mic size={18} strokeWidth={2} />
						) : (
							<AudioLines size={18} strokeWidth={1.8} />
						)}
					</button>
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
						title={uiText.send}
					>
						<SendHorizontal size={16} strokeWidth={2} />
					</button>
				</div>
			</div>
			<p className="text-[10px] text-gray-400 text-center mt-2 select-none">
				{uiText.shortcut}
			</p>
		</div>
	);
}
