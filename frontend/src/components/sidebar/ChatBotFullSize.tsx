import {
	MessageCircle,
	Search,
	SquarePen,
	Minimize2,
	Clock,
	LogOut,
} from "lucide-react";
import { useState, useEffect } from "react";
import FloatingSidebar from "./FloatingSideBar";
import { type Message as FrontendMessage } from "./ChatBotPanel";
import { useAuth } from "../../hooks/useAuth";
import {
	getConversations,
	getConversationDetail,
	type Conversation,
} from "../../api/chatAPI";
import { signOut } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import { useNavigate } from "react-router-dom";

const LOGOUT_EVENT_KEY = "logoutEvent";

interface ChatBotFullSizeProps {
	onClose?: () => void;
	messages: FrontendMessage[];
	setMessages: React.Dispatch<React.SetStateAction<FrontendMessage[]>>;
	isThinking: boolean;
	setIsThinking: React.Dispatch<React.SetStateAction<boolean>>;
	activeChat: string | null;
	setActiveChat: React.Dispatch<React.SetStateAction<string | null>>;
}

function ChatBotFullSize({
	onClose,
	messages,
	setMessages,
	isThinking,
	setIsThinking,
	activeChat,
	setActiveChat,
}: ChatBotFullSizeProps) {
	const [conversations, setConversations] = useState<Conversation[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [searchQuery, setSearchQuery] = useState("");
	const { user, loading } = useAuth();
	const navigate = useNavigate();

	const broadcastLogout = () => {
		const timestamp = Date.now().toString();
		localStorage.setItem(LOGOUT_EVENT_KEY, timestamp);
		window.dispatchEvent(
			new StorageEvent("storage", {
				key: LOGOUT_EVENT_KEY,
				newValue: timestamp,
				storageArea: localStorage,
			}),
		);
	};

	useEffect(() => {
		const fetchConversations = async () => {
			if (user) {
				try {
					setIsLoading(true);
					const token = await user.getIdToken();
					const data = await getConversations(token);
					setConversations(data);
				} catch (error) {
					console.error("Fail to fetch conversations: ", error);
				} finally {
					setIsLoading(false);
				}
			}
		};
		fetchConversations();
	}, [user]);

	useEffect(() => {
		const fetchDetail = async () => {
			if (!activeChat) return;
			if (user) {
				try {
					setIsThinking(true);
					setMessages([]);
					const token = await user.getIdToken();
					const detail = await getConversationDetail(
						token,
						activeChat,
					);
					const formattedMessages = detail.messages.map((m) => ({
						id: m.id,
						role: (m.role === "user" ? "user" : "bot") as
							| "user"
							| "bot",
						content: m.content,
						imageUrl: m.image_url || undefined,
						menuData: m.menu_data || undefined,
						placeSearchData: m.place_search_data || undefined,
					}));
					setMessages(formattedMessages);
				} catch (error) {
					console.error("Fail to fetch conversation detail: ", error);
				} finally {
					setIsThinking(false);
				}
			}
		};
		fetchDetail();
	}, [activeChat, user, setIsThinking, setMessages]);

	const handleNewChat = async () => {
		setActiveChat(null);
		setMessages([]);
		if (user) {
			try {
				const token = await user.getIdToken();
				const data = await getConversations(token);
				setConversations(data);
			} catch (error) {
				console.error("Fail to refresh conversations: ", error);
			}
		}
	};

	const filteredHistory = conversations.filter((chat) =>
		chat.title.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	const handleLogOut = async () => {
		try {
			await signOut(auth);
			localStorage.removeItem("user");
			broadcastLogout();
		} catch (error) {
			console.error("Loi dang xuat:", error);
		}
		navigate("/");
	};

	useEffect(() => {
		const handleStorage = (event: StorageEvent) => {
			if (event.key !== LOGOUT_EVENT_KEY) return;
			navigate("/");
		};
		window.addEventListener("storage", handleStorage);
		return () => window.removeEventListener("storage", handleStorage);
	}, [navigate]);

	return (
		<div className="w-full h-full rounded-t-4xl flex overflow-hidden shadow-[0_-8px_40px_rgba(0,0,0,0.12)] border-t border-gray-200/60">
			{/* ═══════════════════════════════════════════════════════════════════
			    LEFT SIDEBAR — Logo, Search, Chat History
			 ═══════════════════════════════════════════════════════════════════ */}
			<div className="w-70 min-w-70 bg-gray-50/95 backdrop-blur-xl flex flex-col border-r border-gray-200/60 rounded-tl-4xl">
				{/* ── Top: Logo + New chat button ── */}
				<div className="flex items-center justify-between px-5 pt-6 pb-4">
					<div className="flex items-center gap-2.5">
						<div className="w-8 h-8 rounded-xl bg-linear-to-r from-sky-300 to-cyan-300 flex items-center justify-center shadow-md">
							<MessageCircle
								size={16}
								className="text-white"
								strokeWidth={2.5}
							/>
						</div>
						<span className="font-bold text-lg tracking-tight text-gray-800">
							Food Tourism
						</span>
					</div>
					<div className="flex items-center gap-1">
						<button
							title="Thu nhỏ"
							onClick={onClose}
							className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-xl transition-all duration-200 cursor-pointer"
						>
							<Minimize2 size={18} strokeWidth={2} />
						</button>
						<button
							onClick={handleNewChat}
							title="New chat"
							className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-xl transition-all duration-200 cursor-pointer"
						>
							<SquarePen size={18} strokeWidth={2} />
						</button>
					</div>
				</div>

				<div className="px-4 pb-4">
					<div className="flex items-center gap-2 bg-white hover:bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 focus-within:border-blue-400 focus-within:shadow-sm transition-all duration-200">
						<Search size={16} className="text-gray-400 shrink-0" />
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Tìm kiếm..."
							className="grow bg-transparent outline-none text-gray-700 text-sm placeholder:text-gray-400"
						/>
					</div>
				</div>

				<div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
					{isLoading ? (
						<div className="text-center text-gray-400 text-sm mt-8 px-4">
							Loading ...
						</div>
					) : filteredHistory.length > 0 ? (
						filteredHistory.map((chat) => (
							<button
								key={chat.id}
								onClick={() => setActiveChat(chat.id)}
								className={`w-full text-left px-3.5 py-3 rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-3 group ${
									activeChat === chat.id
										? "bg-white shadow-sm border border-gray-200/80 text-gray-900"
										: "text-gray-600 hover:bg-white/70 hover:text-gray-900 border border-transparent"
								}`}
							>
								<Clock
									size={15}
									className={`shrink-0 ${
										activeChat === chat.id
											? "text-orange-500"
											: "text-gray-400 group-hover:text-gray-500"
									}`}
								/>
								<span className="text-sm font-medium truncate">
									{chat.title}
								</span>
							</button>
						))
					) : (
						<div className="text-center text-gray-400 text-sm mt-8 px-4">
							Không tìm thấy đoạn chat nào
						</div>
					)}
				</div>

				{!loading && user && (
					<div className="px-4 py-4 border-t border-gray-200/60">
						<div className="flex items-center gap-3 px-2">
							<img
								src={user.photoURL ?? ""}
								alt={user.displayName ?? "User"}
								className="w-9 h-9 rounded-full"
							/>
							<div className="flex-1 min-w-0">
								<p className="text-sm font-semibold text-gray-800 truncate">
									{user.displayName}
								</p>
								<p className="text-xs text-gray-400 truncate">
									{user.email ?? "No email"}
								</p>
							</div>
							<button
								onClick={handleLogOut}
								title="Đăng xuất"
								className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 cursor-pointer shrink-0"
							>
								<LogOut size={16} strokeWidth={2} />
							</button>
						</div>
					</div>
				)}
			</div>

			{/* ═══════════════════════════════════════════════════════════════════
			    RIGHT PANEL — Chat area (reuses FloatingSidebar in fullsize mode)
			 ═══════════════════════════════════════════════════════════════════ */}
			<div className="flex-1 h-full bg-white rounded-tr-4xl relative">
				<FloatingSidebar
					onClose={onClose || (() => {})}
					messages={messages}
					setMessages={setMessages}
					isThinking={isThinking}
					setIsThinking={setIsThinking}
					isFullSize={true}
					activeChat={activeChat}
					setActiveChat={setActiveChat}
					onConversationCreated={(conv) => {
						setConversations((prev) => [conv, ...prev]);
					}}
				/>
			</div>
		</div>
	);
}

export default ChatBotFullSize;
