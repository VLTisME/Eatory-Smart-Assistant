import { Minimize2, Fullscreen, SquarePen, History, ChevronLeft } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useVoiceRecognition } from "../../hooks/useVoiceRecognition";
import ChatBotPanel, { type Message } from "./ChatBotPanel";
import BentoFeatures from "./BentoFeatures";
import ChatInput from "./ChatInput";
import ImageUploadModel from "../upload-image/ImageUploadModal";
import { uploadMenuImage } from "../../services/menuTranslationApi";
import { useAuth } from "../../hooks/useAuth";
import { getConversations, getConversationDetail, type Conversation } from "../../api/chatAPI";

/**
 * FloatingSidebar — Component cha cho Chatbot UI (Modern Glassmorphism)
 *
 * Kiến trúc lớp:
 *   1. Background abstract gradient mờ (-z-10)
 *   2. Glassmorphism content layer — nội dung chính
 *   3. Rainbow border chuyển xuống bao quanh ChatInput
 */

interface FloatingSidebarProps {
	onClose: () => void;
	messages: Message[];
	setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
	isThinking: boolean;
	setIsThinking: React.Dispatch<React.SetStateAction<boolean>>;
	onFullScreen?: () => void;
	isFullSize?: boolean;
}

type UploadMode = "ocr" | "image-search";

function FloatingSidebar({
	onClose,
	messages,
	setMessages,
	isThinking,
	setIsThinking,
	onFullScreen,
	isFullSize = false,
}: FloatingSidebarProps) {
	// ─── Rainbow border → hiện xung quanh ChatInput khi thinking ─────────────
	const [showRainbow, setShowRainbow] = useState(false);

	useEffect(() => {
		if (isThinking) {
			const timer = setTimeout(() => setShowRainbow(true), 0);
			return () => clearTimeout(timer);
		} else {
			const timer = setTimeout(() => setShowRainbow(false), 800);
			return () => clearTimeout(timer);
		}
	}, [isThinking]);

	// ─── Lịch sử chat (History) ────────────────────────────────────────────────
	const [showHistory, setShowHistory] = useState(false);
	const [conversations, setConversations] = useState<Conversation[]>([]);
	const [isHistoryLoading, setIsHistoryLoading] = useState(false);
	const { user } = useAuth();

	const handleOpenHistory = async () => {
		setShowHistory(!showHistory);
		if (!showHistory && user && conversations.length === 0) {
			try {
				setIsHistoryLoading(true);
				const token = await user.getIdToken();
				const data = await getConversations(token);
				setConversations(data);
			} catch (e) {
				console.error(e);
			} finally {
				setIsHistoryLoading(false);
			}
		}
	};

	const handleSelectHistory = async (chatId: string) => {
		if (!user) return;
		try {
			setIsThinking(true);
			setShowHistory(false);
			setMessages([]);
			const token = await user.getIdToken();
			const detail = await getConversationDetail(token, chatId);
			const formattedMessages = detail.messages.map((m) => ({
				id: m.id,
				role: (m.role === "user" ? "user" : "bot") as "user" | "bot",
				content: m.content,
			}));
			setMessages(formattedMessages);
		} catch (error) {
			console.error("Fail to fetch conversation detail: ", error);
		} finally {
			setIsThinking(false);
		}
	};

	// ─── Voice Recognition ────────────────────────────────────────────────────
	const { isListening, startListening, stopListening } =
		useVoiceRecognition();

	/**
	 * Voice toggle dành cho ChatInput:
	 * Khi transcript hoàn thành → gửi tin nhắn.
	 */
	const handleVoiceToggle = () => {
		if (isListening) {
			stopListening();
			return;
		}
		startListening((transcript) => {
			handleSubmit(transcript);
		});
	};

	/**
	 * Voice toggle dành cho BentoFeatures (Mic card):
	 * Chỉ bật/tắt mic, KHÔNG gửi chat khi transcript về.
	 */
	const handleBentoVoiceToggle = () => {
		if (isListening) {
			stopListening();
			return;
		}
		// Mở mic nhưng không xử lý transcript → người dùng chủ động dừng
		startListening(() => {
			// no-op: không gửi chat
		});
	};

	// ─── Upload Modal ──────────────────────────────────────────────────────────
	const [isOpen, setIsOpen] = useState<boolean>(false);
	const [uploadMode, setUploadMode] = useState<UploadMode>("ocr");

	const handleOpenUploadModal = (mode: UploadMode) => {
		setUploadMode(mode);
		setIsOpen(true);
	};

	// ─── OCR Upload Handler ────────────────────────────────────────────────────
	const handleFileSelected = async (file: File) => {
		const timestamp = Date.now();

		if (uploadMode === "ocr") {
			// ── Bước 1: Thêm user message ──
			setMessages((prev) => [
				...prev,
				{
					id: timestamp.toString(),
					role: "user",
					content: `Translate menu: ${file.name}`,
				},
			]);
			setIsThinking(true);

			try {
				// ── Bước 2: Gọi API OCR ──
				const menuData = await uploadMenuImage(file);

				// ── Bước 3: Hiển thị kết quả trong chat ──
				setMessages((prev) => [
					...prev,
					{
						id: Date.now().toString(),
						role: "bot",
						content: "Translate menu",
						menuData,
					},
				]);
			} catch (err: unknown) {
				// ── Xử lý lỗi ──
				let errorMsg = "Không thể xử lý ảnh. Vui lòng thử lại.";
				if (err && typeof err === "object" && "response" in err) {
					const axiosErr = err as {
						response?: { data?: { detail?: string } };
					};
					errorMsg = axiosErr.response?.data?.detail || errorMsg;
				}
				setMessages((prev) => [
					...prev,
					{
						id: Date.now().toString(),
						role: "bot",
						content: `${errorMsg}`,
					},
				]);
			} finally {
				setIsThinking(false);
			}
		} else {
			// ── Image search — giữ logic cũ ──
			const actionLabel = "Tìm kiếm hình ảnh";
			const botReply =
				"Đã nhận ảnh. Bước tiếp theo là tìm kiếm các hình ảnh tương tự.";

			setMessages((prev) => [
				...prev,
				{
					id: timestamp.toString(),
					role: "user",
					content: `[${actionLabel}] Đã chọn ảnh: ${file.name}`,
				},
				{
					id: (timestamp + 1).toString(),
					role: "bot",
					content: botReply,
				},
			]);
		}
	};

	// ─── Submit handler ────────────────────────────────────────────────────────
	const handleSubmit = (text: string) => {
		if (!text.trim() || isThinking) return;

		setMessages((prev) => [
			...prev,
			{ id: Date.now().toString(), role: "user", content: text },
		]);
		setIsThinking(true);

		// TODO: Thay bằng API call thật
		setTimeout(() => {
			setMessages((prev) => [
				...prev,
				{
					id: (Date.now() + 1).toString(),
					role: "bot",
					content: "Hello",
				},
			]);
			setIsThinking(false);
		}, 3000);
	};

	// ─── Bento feature click ───────────────────────────────────────────────────
	const handleFeatureClick = (label: string) => {
		switch (label) {
			case "Translate Menu":
				handleOpenUploadModal("ocr");
				break;
			case "Search Image":
				handleOpenUploadModal("image-search");
				break;
			case "Voice Assistant":
				// Chỉ bật mic, không gửi chat
				handleBentoVoiceToggle();
				break;
			default:
				// Review Summary và các chức năng khác → gửi chat
				handleSubmit(`Tôi muốn sử dụng tính năng: ${label}`);
				break;
		}
	};

	// ─── ChatInput tool select ─────────────────────────────────────────────────
	const handleToolSelect = (
		toolId: "translate-menu" | "search-image" | "review-summary",
	) => {
		switch (toolId) {
			case "translate-menu":
				handleOpenUploadModal("ocr");
				break;
			case "search-image":
				handleOpenUploadModal("image-search");
				break;
			case "review-summary":
				handleSubmit("Tôi muốn xem tóm tắt đánh giá nhà hàng này.");
				break;
		}
	};

	const hasMessages = messages.length > 0;

	return (
		<div className={`relative w-full h-full flex items-stretch`}>
			{/* ═══════════════════════════════════════════════════════════════════
			    LAYER 0: Background abstract gradient mờ
			 ═══════════════════════════════════════════════════════════════════ */}
			{!isFullSize && (
				<div className="absolute inset-0 -z-10 overflow-hidden rounded-[2.5rem]">
					<div
						className="w-full h-full opacity-[0.07]"
						style={{
							backgroundImage: `
								radial-gradient(circle at 20% 80%, #f97316 0%, transparent 50%),
								radial-gradient(circle at 80% 20%, #a855f7 0%, transparent 50%),
								radial-gradient(circle at 50% 50%, #06b6d4 0%, transparent 60%),
								linear-gradient(135deg, #fef3c7 0%, #fce7f3 50%, #ede9fe 100%)
							`,
						}}
					/>
				</div>
			)}

			{/* ═══════════════════════════════════════════════════════════════════
			    LAYER 1: Glassmorphism content (không có rainbow bao ngoài nữa)
			 ═══════════════════════════════════════════════════════════════════ */}
			<div
				className={`relative w-full h-full flex flex-col overflow-hidden transition-all duration-500 ${
					isFullSize
						? "bg-transparent"
						: "rounded-[2.5rem] shadow-2xl shadow-orange-500/10 bg-white/85 backdrop-blur-xl border border-white/60"
				}`}
			>
				{/* ── Header: Close button ── */}
				{!isFullSize && (
				<div className="flex justify-end items-center px-6 pt-5 pb-2 gap-5">
					<div /> {/* Spacer */}
					<button
						type="button"
						title={showHistory ? "Quay lại" : "Lịch sử"}
						onClick={handleOpenHistory}
						className={`p-2 rounded-xl transition-all duration-300 cursor-pointer ${
							showHistory 
								? "bg-gray-200 text-gray-700 shadow-sm scale-105" 
								: "text-gray-400 hover:text-gray-600 hover:bg-gray-100/80"
						}`}
					>
						{showHistory ? <ChevronLeft size={18} strokeWidth={2.5} /> : <History size={18} strokeWidth={2} />}
					</button>
					<button
						type="button"
						title="New chat"
						className="p-2 text-gray-400 hover:text-gray-600
							hover:bg-gray-100/80 rounded-xl
							transition-all duration-200 cursor-pointer"
					>
						<SquarePen size={18} strokeWidth={2} />
					</button>
					<button
						type="button"
						onClick={onFullScreen}
						className="p-2 text-gray-400 hover:text-gray-600
							hover:bg-gray-100/80 rounded-xl
							transition-all duration-200 cursor-pointer"
						title="FullScreen"
					>
						<Fullscreen size={18} strokeWidth={2} />
					</button>
					<button
						type="button"
						onClick={onClose}
						className="p-2 text-gray-400 hover:text-gray-600
							hover:bg-gray-100/80 rounded-xl
							transition-all duration-200 cursor-pointer"
						title="Minimize"
					>
						<Minimize2 size={18} strokeWidth={2} />
					</button>
				</div>
				)}

				{/* ── Logo "Food Tourism" ── */}
				{!isFullSize && (
				<div className="text-center px-6 pb-4">
					<h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
						<span
							className="bg-linear-to-r from-orange-400 to-rose-500
								bg-clip-text text-transparent"
						>
							Food
						</span>
						<span className="text-gray-700 ml-2">Tourism</span>
					</h1>
					{!hasMessages && (
						<p className="text-xs text-gray-400 mt-1.5 animate-fade-in-up">
							Trợ lý ẩm thực du lịch thông minh
						</p>
					)}
				</div>
				)}

				{/* ── Content area ── */}
				<div className={`flex-1 overflow-y-auto px-5 pb-2 min-h-0 ${isFullSize ? "pt-6" : ""}`}>
					{showHistory ? (
						<div className="flex flex-col gap-3 py-3">
							<div className="px-2 mb-2 flex flex-col gap-1">
								<h3 className="text-xl font-bold tracking-tight text-gray-800">Lịch sử trò chuyện</h3>
								<p className="text-xs font-medium text-gray-500">Tìm lại các chuyến đi trước đây</p>
							</div>
							
							{isHistoryLoading ? (
								<div className="text-center text-gray-500 py-10 font-medium animate-pulse">Đang tải lịch sử...</div>
							) : conversations.length > 0 ? (
								conversations.map((chat, index) => (
									<button
										key={chat.id}
										onClick={() => handleSelectHistory(chat.id)}
										className="w-full text-left px-5 py-4 bento-card animate-spring-enter flex flex-col gap-2.5 group hover:bg-white/80"
										style={{ animationDelay: `${index * 0.05}s` }}
									>
										<div className="flex items-center gap-3 w-full">
											<div className="p-2 rounded-xl bg-gray-100 text-gray-500 group-hover:scale-110 group-hover:bg-gray-200 transition-all duration-300">
												<History size={16} strokeWidth={2.5} />
											</div>
											<span className="text-[15px] font-bold text-gray-800 truncate group-hover:text-gray-900 transition-colors">
												{chat.title}
											</span>
										</div>
										<span className="text-xs font-semibold text-gray-400 pl-12 opacity-80 group-hover:opacity-100 transition-opacity">
											{chat.created_at ? new Date(chat.created_at).toLocaleDateString("vi-VN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Vừa xong"}
										</span>
									</button>
								))
							) : (
								<div className="text-center text-gray-500 py-10 font-medium">Bạn chưa có cuộc trò chuyện nào.</div>
							)}
						</div>
					) : !hasMessages ? (
						/* Khi chưa có tin nhắn → Hiển thị Bento Grid */
						<BentoFeatures
							isListening={isListening}
							onFeatureClick={handleFeatureClick}
						/>
					) : (
						/* Khi có tin nhắn → Hiển thị ChatBotPanel */
						<ChatBotPanel
							messages={messages}
							isThinking={isThinking}
						/>
					)}
				</div>

				{/* ── Input area (rainbow border ở đây) ── */}
				{!showHistory && (
					<ChatInput
						onSubmit={handleSubmit}
						isThinking={isThinking}
						isListening={isListening}
						onVoiceToggle={handleVoiceToggle}
						onToolSelect={handleToolSelect}
						showRainbow={showRainbow}
					/>
				)}
			</div>

			{/* ── Image Upload Modal ── */}
			<ImageUploadModel
				isOpen={isOpen}
				onClose={() => setIsOpen(false)}
				onFileSelected={handleFileSelected}
				mode={uploadMode}
			/>
		</div>
	);
}

export default FloatingSidebar;
