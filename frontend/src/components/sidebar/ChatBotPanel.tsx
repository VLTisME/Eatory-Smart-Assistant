import { useEffect, useRef } from "react";

export interface Message {
	id: string;
	role: "user" | "bot";
	content: string;
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
					<div
						className={`max-w-[85%] p-3 rounded-2xl shadow-sm leading-relaxed ${
							msg.role === "user"
								? "bg-blue-600 text-white rounded-br-sm"
								: "bg-white border border-gray-100 text-gray-800 rounded-bl-sm"
						}`}
					>
						{msg.content}
					</div>
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
