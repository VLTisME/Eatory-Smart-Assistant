//src/components/HomepageUI/Navbar/UserMenu.tsx
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Avatar from "./Avatar";
import Dropdown from "./Dropdown";

const LOGOUT_EVENT_KEY = "logoutEvent";

interface Props {
	user: {
		name: string;
		avatar: string;
	};
	onLogout?: () => void;
}

export default function UserMenu({ user, onLogout }: Props) {
	const navigate = useNavigate();
	const [open, setOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

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

	// Xử lý Logout
	const handleLogout = () => {
		localStorage.removeItem("user");
		broadcastLogout();
		window.dispatchEvent(new Event("userChange"));

		if (onLogout) onLogout();
		setOpen(false);
		navigate("/");
	};

	useEffect(() => {
		const handleStorage = (event: StorageEvent) => {
			if (event.key !== LOGOUT_EVENT_KEY) return;
			if (onLogout) onLogout();
			setOpen(false);
			navigate("/");
		};
		window.addEventListener("storage", handleStorage);
		return () => window.removeEventListener("storage", handleStorage);
	}, [navigate, onLogout]);

	// Đóng dropdown khi click ra ngoài
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				menuRef.current &&
				!menuRef.current.contains(event.target as Node)
			) {
				setOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () =>
			document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	return (
		<div className="relative" ref={menuRef}>
			{/* Avatar có thêm cursor-pointer để user biết là click được */}
			<div className="cursor-pointer transition-transform active:scale-95">
				<Avatar src={user.avatar} onClick={() => setOpen(!open)} />
			</div>

			{open && (
				<div className="absolute right-0 mt-2 w-48 animate-in fade-in zoom-in duration-200 z-50">
					<Dropdown name={user.name} onLogout={handleLogout} />
				</div>
			)}
		</div>
	);
}
