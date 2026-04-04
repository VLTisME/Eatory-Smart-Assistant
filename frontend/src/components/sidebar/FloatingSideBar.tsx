import { Minimize2, SendHorizonal } from "lucide-react";
import { AudioLines } from "lucide-react";
import { Mic } from "lucide-react";
import React, { useRef, useState } from "react";
import { useVoiceRecognition } from "../../hooks/useVoiceRecognition";
interface FloatingSidebarProps {
	onClose: () => void;
}

function FloatingSidebar({ onClose }: FloatingSidebarProps) {
	const [text, setText] = useState<string>("");
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setText(e.target.value);

		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";

			textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
		}
	};

	const { isListening, startListening, stopListening } =
		useVoiceRecognition();

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
		if (!text.trim()) return;
		console.log("Đã gửi:", text);

		setText("");
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
		}
	};
	return (
		<div className="w-95 h-full bg-white rounded-[28px] shadow-2xl flex flex-col border border-gray-200 overflow-hidden transition-all duration-300">
			{/* Header: Nút bật/tắt khung */}
			<div className="flex justify-end items-center p-2 border-b bg-gray-50">
				<button
					onClick={onClose}
					className="p-1.5 text-gray-500 hover:bg-gray-200 hover:text-gray-800 rounded-md transition-color cursor-pointer"
					title="Đóng khung"
				>
					<Minimize2 size={20} />
				</button>
			</div>

			<div className="flex-1 p-4 overflow-y-auto bg-gray-50/50">
				<div className="text-center text-sm text-gray-400 mt-10">
					Khung hiển thị hội thoại AI...
				</div>
			</div>

			<div className="p-4 border-t bg-white space-y-3">
				{/* Khung nhập text */}
				<div className="relative">
					<div className="w-full max-w-3xl mx-auto">
						<div className="flex items-end gap-2 bg-gray-100 p-1 rounded-3xl border border-gray-300 focus-within:border-gray-400 focus-within:bg-white transition-all shadow-sm">
							<textarea
								ref={textareaRef}
								value={text}
								onChange={handleChange}
								rows={1}
								placeholder="Nhập ý tưởng của bạn"
								className="grow resize-none bg-transparent outline-none text-gray-800 py-3 px-4 max-h-50 overflow-y-auto"
							/>

							<button
								onClick={
									text.trim() ? handleSend : handleVoiceChange
								}
								className={`shrink-0 mb-1 mr-1 p-2 rounded-full transition-colors flex items-center justify-center ${
									text.trim()
										? "bg-blue-600 text-white hover:bg-blue-700"
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
						className="flex flex-col items-center gap-1 group"
						title="OCR Dịch Menu"
					>
						<div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center border border-red-100 group-hover:bg-red-500 group-hover:text-white transition-all shadow-sm">
							<svg
								className="w-5 h-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
								/>
							</svg>
						</div>
					</button>

					<button
						className="flex flex-col items-center gap-1 group"
						title="Tìm kiếm hình ảnh"
					>
						<div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center border border-red-100 group-hover:bg-red-500 group-hover:text-white transition-all shadow-sm">
							<svg
								className="w-5 h-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
								/>
							</svg>
						</div>
					</button>

					<button
						className="flex flex-col items-center gap-1 group"
						title="Phân tích Review"
					>
						<div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center border border-red-100 group-hover:bg-red-500 group-hover:text-white transition-all shadow-sm">
							<svg
								className="w-5 h-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
								/>
							</svg>
						</div>
					</button>
				</div>
			</div>
		</div>
	);
}

export default FloatingSidebar;
