import { Minimize2, SendHorizonal } from "lucide-react";
import { AudioLines } from "lucide-react";
import { Mic } from "lucide-react";
import { Globe, ImagePlus, ChartColumn } from "lucide-react";
import React, { useRef, useState } from "react";
import { useVoiceRecognition } from "../../hooks/useVoiceRecognition";
import foodLogo from "../../assets/food-logo.png";
import ChatBotPanel, { type Message } from "./ChatBotPanel";
import ImageUploadModel from "../upload-image/ImageUploadModal";

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
	const [text, setText] = useState<string>("");

	const { isListening, startListening, stopListening } =
		useVoiceRecognition();
	const [isOpen, setIsOpen] = useState<boolean>(false);
	const [uploadMode, setUploadMode] = useState<UploadMode>("ocr");

	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setText(e.target.value);

		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";

			textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
		}
	};

	const handleVoiceChange = () => {
		if (isListening) {
			stopListening();
			return;
		}
		startListening((transcript) => {
			setText(transcript);

			if (textareaRef.current) {
				textareaRef.current.style.height = "auto";
				textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
			}
		});
	};

	const handleSend = () => {
		if (!text.trim() || isThinking) return;
		const userText = text;
		const userNewMsg: Message = {
			id: Date.now().toString(),
			role: "user",
			content: userText,
		};
		setMessages((prev) => [...prev, userNewMsg]);

		setText("");
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
		}
		setIsThinking(true);
		setTimeout(() => {
			const botMsg: Message = {
				id: (Date.now() + 1).toString(),
				role: "bot",
				content: "Hello",
			};
			setMessages((prev) => [...prev, botMsg]);
			setIsThinking(false);
		}, 3000);
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	const handleOpenUploadModal = (mode: UploadMode) => {
		setUploadMode(mode);
		setIsOpen(true);
	};

	const handleFileSelected = (file: File) => {
		const actionLabel =
			uploadMode === "ocr" ? "OCR Dịch Menu" : "Tìm kiếm hình ảnh";
		const botReply =
			uploadMode === "ocr"
				? "Đã nhận ảnh menu. Bước tiếp theo là OCR và dịch nội dung."
				: "Đã nhận ảnh. Bước tiếp theo là tìm kiếm các hình ảnh tương tự.";
		const timestamp = Date.now();

		const uploadedImageMessage: Message = {
			id: timestamp.toString(),
			role: "user",
			content: `[${actionLabel}] Đã chọn ảnh: ${file.name}`,
		};

		const statusMessage: Message = {
			id: (timestamp + 1).toString(),
			role: "bot",
			content: botReply,
		};

		setMessages((prev) => [...prev, uploadedImageMessage, statusMessage]);
	};

	return (
		<div className="w-100 h-full bg-white rounded-3xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden transition-all duration-300">
			<div className="flex justify-end items-center p-2 border-b bg-gray-50">
				<button
					onClick={onClose}
					className="p-1 text-gray-500 hover:text-gray-800 hover:scale-[0.8] transition-all duration-300 ease-in-out rounded-md cursor-pointer"
					title="Đóng khung"
				>
					<Minimize2 size={23} />
				</button>
			</div>

			<div className="flex-1 p-4 overflow-y-auto bg-gray-50/50">
				{messages.length === 0 ? (
					<div className="flex items-center justify-center opacity-40">
						<img
							className="w-30 h-30"
							src={foodLogo}
							alt="Food logo"
						/>
						<span className="font-semibold text-orange-400 text-[22px] uppercase mt-12 -translate-x-4">
							Tourism
						</span>
					</div>
				) : (
					<ChatBotPanel messages={messages} isThinking={isThinking} />
				)}
			</div>

			<div className="p-4 border-t bg-white space-y-3">
				{/* Khung nhập text */}
				<div className="relative w-full">
					<div className="w-full mx-auto">
						<div className="flex items-end gap-2 bg-gray-100 p-1 rounded-3xl border border-gray-300 focus-within:border-gray-400 focus-within:bg-white transition-all shadow-sm">
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
										: "Thêm ý tưởng của bạn..."
								}
								className="grow resize-none bg-transparent outline-none text-gray-800 py-3 px-4 max-h-50 overflow-y-auto"
							/>

							<button
								onClick={
									text.trim() ? handleSend : handleVoiceChange
								}
								disabled={isThinking && text.trim() != ""}
								className={`shrink-0 mb-1 mr-1 p-2 rounded-full transition-colors flex items-center justify-center ${
									text.trim()
										? "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
										: isListening
											? "bg-black text-red-800 mic-animation"
											: "bg-gray-300 text-gray-500 cursor-pointer hover:text-white hover:bg-green-500"
								}`}
							>
								{text.trim() ? (
									<SendHorizonal />
								) : isListening ? (
									<Mic />
								) : (
									<AudioLines />
								)}
							</button>
						</div>
					</div>
				</div>

				<div className="flex gap-3 justify-center">
					<button
						onClick={() => handleOpenUploadModal("ocr")}
						className="flex flex-col items-center gap-1 group"
						title="OCR Dịch Menu"
					>
						<div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center border border-red-100 group-hover:bg-red-500 group-hover:text-white transition-all shadow-sm cursor-pointer duration-300">
							<Globe size={20} strokeWidth={2} />
						</div>
					</button>

					<button
						onClick={() => handleOpenUploadModal("image-search")}
						className="flex flex-col items-center gap-1 group"
						title="Tìm kiếm hình ảnh"
					>
						<div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center border border-red-100 group-hover:bg-red-500 group-hover:text-white transition-all shadow-sm cursor-pointer duration-300">
							<ImagePlus size={20} strokeWidth={2} />
						</div>
					</button>

					<button
						className="flex flex-col items-center gap-1 group"
						title="Phân tích Review"
					>
						<div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center border border-red-100 group-hover:bg-red-500 group-hover:text-white transition-all shadow-sm cursor-pointer duration-300">
							<ChartColumn size={20} strokeWidth={2} />
						</div>
					</button>
				</div>
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
