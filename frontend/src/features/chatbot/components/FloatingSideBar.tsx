import {
	Minimize2,
	Fullscreen,
	SquarePen,
	History,
	ChevronLeft,
	Trash,
} from "lucide-react";
import React, { useEffect, useState, useCallback } from "react";
import { useVoiceRecognition } from "../hooks/useVoiceRecognition";
import ChatBotPanel, { type Message } from "./ChatBotPanel";
import BentoFeatures from "./BentoFeatures";
import ChatInput from "./ChatInput";
import ImageUploadModel from "./ImageUploadModal";
import { uploadMenuImage } from "../services/menuTranslationApi";
import { uploadPlaceSearchImage } from "../services/placeSearchApi";
import { uploadToImageKit } from "../../../services/imageKitApi";
import { sendRagChat } from "../services/ragApi";
import { useAuth } from "../../auth/hooks/useAuth";
import {
	getConversations,
	getConversationDetail,
	createConversation,
	sendMessage,
	type Conversation,
	deleteConversation,
} from "../services/chatAPI";
import Logo from "../../../assets/logo-color.svg";
import type { PlaceSearchItem } from "../../../types/placeSearch";

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
	activeChat?: string | null;
	setActiveChat?: (id: string | null) => void;
	onConversationCreated?: (conv: Conversation) => void;
	onPlaceClick?: (item: PlaceSearchItem) => void;
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
	activeChat,
	setActiveChat,
	onConversationCreated,
	onPlaceClick,
}: FloatingSidebarProps) {
	const [localActiveChat, setLocalActiveChat] = useState<string | null>(null);
	const currentActiveChat =
		activeChat !== undefined ? activeChat : localActiveChat;

	const handleSetActiveChat = useCallback(
		(id: string | null) => {
			if (setActiveChat) setActiveChat(id);
			setLocalActiveChat(id);
		},
		[setActiveChat, setLocalActiveChat],
	);
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
	const [showHistory, setShowHistory] = useState(false);
	const [conversations, setConversations] = useState<Conversation[]>([]);
	const [isHistoryLoading, setIsHistoryLoading] = useState(false);
	const [toast, setToast] = useState<{
		message: string;
		type: "success" | "error";
		visible: boolean;
	} | null>(null);
	const { user } = useAuth();

	const showToast = (message: string, type: "success" | "error") => {
		setToast({ message, type, visible: true });
		setTimeout(() => {
			setToast((prev) => (prev ? { ...prev, visible: false } : prev));
		}, 1800);
		setTimeout(() => {
			setToast(null);
		}, 2200);
	};

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
			const formattedMessages = detail.messages.map((m: any) => ({
				id: m.id,
				role: (m.role === "user" ? "user" : "bot") as "user" | "bot",
				content: m.content,
				imageUrl: m.image_url || undefined,
				menuData: m.menu_data || undefined,
				placeSearchData: m.place_search_data || undefined,
			}));
			setMessages(formattedMessages);
			handleSetActiveChat(chatId);
		} catch (error) {
			console.error("Fail to fetch conversation detail: ", error);
		} finally {
			setIsThinking(false);
		}
	};

	const handleDeleteHistory = async (chatID: string) => {
		if (!user) return;
		try {
			const token = await user.getIdToken();
			const isSuccess = await deleteConversation(token, chatID);
			if (isSuccess) {
				setConversations((preConv) =>
					preConv.filter((conv) => conv.id !== chatID),
				);
				showToast("Xóa trò chuyện thành công.", "success");
			} else {
				showToast("Xóa thất bại, vui lòng thử lại.", "error");
			}
		} catch (error) {
			console.error("Failed to delete conversation: ", error);
			showToast("Xoa that bai. Vui long thu lai.", "error");
		}
	};

	const { isListening, startListening, stopListening } =
		useVoiceRecognition();

	const handleVoiceToggle = () => {
		if (isListening) {
			stopListening();
			return;
		}
		startListening((transcript: string) => {
			handleSubmit(transcript);
		});
	};

	const handleBentoVoiceToggle = () => {
		if (isListening) {
			stopListening();
			return;
		}
		startListening((transcript: string) => {
			handleSubmit(transcript);
		});
	};

	const [isOpen, setIsOpen] = useState<boolean>(false);
	const [uploadMode, setUploadMode] = useState<UploadMode>("ocr");

	const handleOpenUploadModal = (mode: UploadMode) => {
		setUploadMode(mode);
		setIsOpen(true);
	};

	const processUserAction = useCallback(
		async (
			userText: string,
			actionLogic: (token: string, chatIdToUse: string) => Promise<void>,
			options?: {
				imageUrl?: string;
				isImageLoading?: boolean;
				imageUploadPromise?: Promise<string | undefined>;
			},
		) => {
			if (isThinking || !user) return;

			const userMsgId = Date.now().toString();
			setMessages((prev) => [
				...prev,
				{
					id: userMsgId,
					role: "user",
					content: userText,
					imageUrl: options?.imageUrl,
					isImageLoading: options?.isImageLoading,
				},
			]);
			setIsThinking(true);

			try {
				const token = await user.getIdToken();
				let chatIdToUse = currentActiveChat;

				if (!chatIdToUse) {
					const title =
						userText.length > 30
							? userText.substring(0, 30) + "..."
							: userText;
					const newConv = await createConversation(token, title);
					chatIdToUse = newConv.id;
					handleSetActiveChat(newConv.id);

					if (onConversationCreated) {
						onConversationCreated(newConv);
					} else {
						setConversations((prev) => [newConv, ...prev]);
					}
				}

				let finalImageUrl = options?.imageUrl;
				if (options?.imageUploadPromise) {
					const uploadedUrl = await options.imageUploadPromise;
					if (uploadedUrl) {
						finalImageUrl = uploadedUrl;
						setMessages((prev) =>
							prev.map((msg) =>
								msg.id === userMsgId
									? {
											...msg,
											imageUrl: uploadedUrl,
											isImageLoading: false,
										}
									: msg,
							),
						);
					} else {
						setMessages((prev) =>
							prev.map((msg) =>
								msg.id === userMsgId
									? { ...msg, isImageLoading: false }
									: msg,
							),
						);
					}
				}

				await sendMessage(token, chatIdToUse!, {
					role: "user",
					content: userText,
					image_url: finalImageUrl,
				});

				await actionLogic(token, chatIdToUse!);
			} catch (error) {
				console.error("Action failed: ", error);
				let errorMsg =
					"Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.";
				if (error && typeof error === "object" && "response" in error) {
					const axiosErr = error as {
						response?: { data?: { detail?: string } };
					};
					errorMsg = axiosErr.response?.data?.detail || errorMsg;
				}
				setMessages((prev) => {
					const clearedPrev = prev.map((msg) =>
						msg.id === userMsgId
							? { ...msg, isImageLoading: false }
							: msg,
					);
					return [
						...clearedPrev,
						{
							id: (Date.now() + 1).toString(),
							role: "bot",
							content: errorMsg,
						},
					];
				});
			} finally {
				setIsThinking(false);
			}
		},
		[
			isThinking,
			user,
			currentActiveChat,
			handleSetActiveChat,
			onConversationCreated,
			setIsThinking,
			setMessages,
		],
	);

	const uploadImageToKit = async (
		file: File,
	): Promise<string | undefined> => {
		if (!user) return undefined;
		try {
			const firebaseToken = await user.getIdToken();
			const uploadResult = await uploadToImageKit(file, firebaseToken);
			return uploadResult.url;
		} catch (error) {
			console.error("ImageKit upload failed (non-critical):", error);
			return undefined;
		}
	};

	const handleFileSelected = async (file: File) => {
		if (uploadMode === "ocr") {
			const imageUploadPromise = uploadImageToKit(file);

			processUserAction(
				`[Translate Menu]`,
				async (token, chatIdToUse) => {
					const menuData = await uploadMenuImage(file);

					const savedBotMsg = await sendMessage(token, chatIdToUse, {
						role: "bot",
						content: "Đã dịch menu thành công!",
						menu_data: menuData,
					});

					setMessages((prev) => [
						...prev,
						{
							id: savedBotMsg.id || Date.now().toString(),
							role: "bot",
							content: savedBotMsg.content,
							menuData,
						},
					]);
				},
				{ isImageLoading: true, imageUploadPromise },
			);
		} else if (uploadMode === "image-search") {
			const imageUploadPromise = uploadImageToKit(file);

			processUserAction(
				`[Tìm kiếm hình ảnh]`,
				async (token, chatIdToUse) => {
					const placeData = await uploadPlaceSearchImage(file);

					const topResults = placeData.results.slice(0, 5);

					if (topResults.length === 0) {
						const savedBotMsg = await sendMessage(
							token,
							chatIdToUse,
							{
								role: "bot",
								content:
									"Không tìm thấy địa điểm phù hợp từ ảnh này.",
							},
						);

						setMessages((prev) => [
							...prev,
							{
								id: savedBotMsg.id || Date.now().toString(),
								role: "bot",
								content: savedBotMsg.content,
							},
						]);
						return;
					}

					const savedBotMsg = await sendMessage(token, chatIdToUse, {
						role: "bot",
						content: "Đã tìm thấy các địa điểm tương tự.",
						place_search_data: { results: topResults },
					});

					setMessages((prev) => [
						...prev,
						{
							id: savedBotMsg.id || Date.now().toString(),
							role: "bot",
							content: savedBotMsg.content,
							placeSearchData: savedBotMsg.place_search_data || {
								results: topResults,
							},
						},
					]);
				},
				{ isImageLoading: true, imageUploadPromise },
			);
		}
	};

	useEffect(() => {
		const handleProcessAction = (event: Event) => {
			const e = event as CustomEvent<{
				action: string;
				placeId: string;
				name: string;
			}>;
			const { action, placeId, name } = e.detail;
			if (action === "review-summary") {
				const userText = `Review summary ${name}`;
				processUserAction(userText, async (token, chatIdToUse) => {
					let botReplyContent = "Không tìm thấy dữ liệu đánh giá.";
					try {
						const { fetchReviewSummary } =
							await import("../../map-search/services/placeAPI");
						const res = await fetchReviewSummary(placeId);
						botReplyContent = res.summary;
					} catch (err) {
						console.error(err);
					}
					const savedBotMsg = await sendMessage(token, chatIdToUse, {
						role: "bot",
						content: botReplyContent,
					});

					setMessages((prev) => [
						...prev,
						{
							id: savedBotMsg.id || (Date.now() + 1).toString(),
							role: "bot",
							content: savedBotMsg.content,
						},
					]);
				});
			}
		};
		window.addEventListener("process-chatbot-action", handleProcessAction);
		return () =>
			window.removeEventListener(
				"process-chatbot-action",
				handleProcessAction,
			);
	}, [processUserAction, setMessages]);

	const handleSubmit = (text: string) => {
		if (!text.trim()) return;
		processUserAction(text, async (token, chatIdToUse) => {
			// Call the RAG chatbot API for an AI-generated answer
			let botReplyContent: string;
			try {
				const ragResponse = await sendRagChat({ message: text });
				botReplyContent = ragResponse.answer;
			} catch (error) {
				console.error("RAG chat failed, using fallback:", error);
				botReplyContent =
					"Xin lỗi, hệ thống AI đang gặp sự cố. Vui lòng thử lại sau.";
			}

			const savedBotMsg = await sendMessage(token, chatIdToUse, {
				role: "bot",
				content: botReplyContent,
			});

			setMessages((prev) => [
				...prev,
				{
					id: savedBotMsg.id || (Date.now() + 1).toString(),
					role: "bot",
					content: savedBotMsg.content,
				},
			]);
		});
	};

	const handleFeatureClick = (label: string) => {
		switch (label) {
			case "Translate Menu":
				handleOpenUploadModal("ocr");
				break;
			case "Search Image":
				handleOpenUploadModal("image-search");
				break;
			case "Voice Assistant":
				handleBentoVoiceToggle();
				break;
			default:
				break;
		}
	};

	const handleToolSelect = (toolId: "translate-menu" | "search-image") => {
		switch (toolId) {
			case "translate-menu":
				handleOpenUploadModal("ocr");
				break;
			case "search-image":
				handleOpenUploadModal("image-search");
				break;
		}
	};

	const hasMessages = messages.length > 0;

	return (
		<div className={`relative w-full h-full flex items-stretch`}>
			{toast && (
				<div
					className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl text-sm font-semibold shadow-lg transition-all duration-300 pointer-events-none whitespace-nowrap ${
						toast.type === "success"
							? "bg-emerald-500/90 text-white"
							: "bg-rose-500/90 text-white"
					} ${
						toast.visible
							? "opacity-100 translate-y-0"
							: "opacity-0 -translate-y-3"
					}`}
				>
					{toast.message}
				</div>
			)}
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
							{showHistory ? (
								<ChevronLeft size={18} strokeWidth={2.5} />
							) : (
								<History size={18} strokeWidth={2} />
							)}
						</button>
						<button
							type="button"
							title="New chat"
							onClick={() => {
								setMessages([]);
								handleSetActiveChat(null);
								setShowHistory(false);
								setConversations([]);
							}}
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
				{!isFullSize && (
					<div className="text-center px-6 pb-4">
						<div className="flex items-center justify-center gap-3 text-2xl sm:text-3xl font-bold tracking-tight">
							<img
								src={Logo}
								alt="Eatory logo"
								className="h-10 w-auto"
							/>
							<span className="text-2xl font-bold tracking-wide">
								EATORY
							</span>
						</div>
						{!hasMessages && (
							<p className="text-xs text-gray-400 mt-1.5 animate-fade-in-up">
								Trợ lý ẩm thực du lịch thông minh
							</p>
						)}
					</div>
				)}
				<div
					className={`flex-1 overflow-y-auto px-5 pb-2 min-h-0 ${isFullSize ? "pt-6" : ""}`}
				>
					{showHistory ? (
						<div className="flex flex-col gap-3 py-3">
							<div className="px-2 mb-2 flex flex-col gap-1">
								<h3 className="text-xl font-bold tracking-tight text-gray-800">
									Lịch sử trò chuyện
								</h3>
								<p className="text-xs font-medium text-gray-500">
									Tìm lại các chuyến đi trước đây
								</p>
							</div>

							{isHistoryLoading ? (
								<div className="text-center text-gray-500 py-10 font-medium animate-pulse">
									Đang tải lịch sử...
								</div>
							) : conversations.length > 0 ? (
								conversations.map((chat, index) => (
									<div
										key={chat.id}
										onClick={() =>
											handleSelectHistory(chat.id)
										}
										className="w-full text-left px-5 py-4 bento-card animate-spring-enter flex flex-col gap-2.5 group hover:bg-white/80 cursor-pointer"
										style={{
											animationDelay: `${index * 0.05}s`,
										}}
									>
										<div className="flex items-center gap-3 w-full">
											<div className="p-2 rounded-xl bg-gray-100 text-gray-500 group-hover:scale-110 group-hover:bg-gray-200 transition-all duration-300">
												<History
													size={16}
													strokeWidth={2.5}
												/>
											</div>
											<span className="text-[15px] font-bold text-gray-800 truncate group-hover:text-gray-900 transition-colors">
												{chat.title}
											</span>
											<button
												onClick={(e) => {
													e.stopPropagation();
													handleDeleteHistory(
														chat.id,
													);
												}}
												className="ml-auto text-gray-400 transition-colors duration-300 p-1.5 hover:text-red-500 cursor-pointer"
											>
												<Trash
													size={16}
													strokeWidth={2.5}
												/>
											</button>
										</div>
										<span className="text-xs font-semibold text-gray-400 pl-12 opacity-80 group-hover:opacity-100 transition-opacity">
											{chat.created_at
												? new Date(
														chat.created_at,
													).toLocaleDateString(
														"vi-VN",
														{
															month: "short",
															day: "numeric",
															hour: "2-digit",
															minute: "2-digit",
														},
													)
												: "Vừa xong"}
										</span>
									</div>
								))
							) : (
								<div className="text-center text-gray-500 py-10 font-medium">
									Bạn chưa có cuộc trò chuyện nào.
								</div>
							)}
						</div>
					) : !hasMessages ? (
						<BentoFeatures
							isListening={isListening}
							onFeatureClick={handleFeatureClick}
						/>
					) : (
						<ChatBotPanel
							messages={messages}
							isThinking={isThinking}
							onPlaceClick={onPlaceClick}
						/>
					)}
				</div>
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
