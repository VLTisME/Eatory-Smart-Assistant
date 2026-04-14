import { Minimize2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useVoiceRecognition } from "../../hooks/useVoiceRecognition";
import ChatBotPanel, { type Message } from "./ChatBotPanel";
import BentoFeatures from "./BentoFeatures";
import ChatInput from "./ChatInput";
import ImageUploadModel from "../upload-image/ImageUploadModal";
import { uploadMenuImage } from "../../services/menuTranslationApi";

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
}

type UploadMode = "ocr" | "image-search";

function FloatingSidebar({
	onClose,
	messages,
	setMessages,
	isThinking,
	setIsThinking,
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
		<div className="relative w-full h-full flex items-stretch">
			{/* ═══════════════════════════════════════════════════════════════════
			    LAYER 0: Background abstract gradient mờ
			 ═══════════════════════════════════════════════════════════════════ */}
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

			{/* ═══════════════════════════════════════════════════════════════════
			    LAYER 1: Glassmorphism content (không có rainbow bao ngoài nữa)
			 ═══════════════════════════════════════════════════════════════════ */}
			<div
				className="relative w-full rounded-[2.5rem] shadow-2xl shadow-orange-500/10
					bg-white/85 backdrop-blur-xl flex flex-col overflow-hidden border border-white/60"
			>
				{/* ── Header: Close button ── */}
				<div className="flex justify-between items-center px-6 pt-5 pb-2">
					<div /> {/* Spacer */}
					<button
						onClick={onClose}
						className="p-2 text-gray-400 hover:text-gray-600
							hover:bg-gray-100/80 rounded-xl
							transition-all duration-200 cursor-pointer"
						title="Thu nhỏ"
					>
						<Minimize2 size={18} strokeWidth={2} />
					</button>
				</div>

				{/* ── Logo "Food Tourism" ── */}
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

				{/* ── Content area ── */}
				<div className="flex-1 overflow-y-auto px-5 pb-2 min-h-0">
					{!hasMessages ? (
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
				<ChatInput
					onSubmit={handleSubmit}
					isThinking={isThinking}
					isListening={isListening}
					onVoiceToggle={handleVoiceToggle}
					onToolSelect={handleToolSelect}
					showRainbow={showRainbow}
				/>
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
